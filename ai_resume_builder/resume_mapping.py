"""Normalize document facts into editable resume fields without inventing qualifications."""
from decimal import Decimal, InvalidOperation

MAPPING_VERSION = 2
PERSONAL_FIELDS = ('name', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'website')
SECTION_FIELDS = {
    'education': ('degree', 'institution', 'year', 'details'),
    'experience': ('role', 'company', 'duration', 'description'),
    'projects': ('name', 'technologies', 'description', 'link'),
}


def text(value):
    return value.strip() if isinstance(value, str) else ''


def scalar(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return text(value)


def first(records, *keys):
    for record in records:
        for key in keys:
            value = scalar(record.get(key))
            if value:
                return value
    return ''


def contexts(record):
    result = [record]
    for key in ('academic_details', 'education_details', 'academic_summary', 'marks_summary', 'overall_result', 'results', 'result'):
        if isinstance(record.get(key), dict):
            result.append(record[key])
    return result


def academic_details(record):
    records = contexts(record)
    parts = []
    cgpa = first(records, 'cgpa', 'CGPA', 'cumulative_gpa')
    gpa = first(records, 'gpa', 'GPA')
    if cgpa or gpa:
        parts.append(f"{'CGPA' if cgpa else 'GPA'}: {cgpa or gpa}")
    percentage = first(records, 'overall_percentage', 'total_percentage', 'percentage', 'percentage_obtained')
    obtained = first(records, 'total_marks_obtained', 'marks_obtained', 'total_obtained', 'obtained_marks')
    maximum = first(records, 'maximum_marks', 'total_max_marks', 'max_marks', 'total_possible_marks', 'total_marks')
    calculated = False
    if not percentage and obtained and maximum:
        try:
            numerator, denominator = Decimal(obtained), Decimal(maximum)
            if numerator.is_finite() and denominator.is_finite() and denominator > 0 and 0 <= numerator <= denominator:
                calculated = True
                percentage = format((numerator / denominator * 100).quantize(Decimal('0.01')), 'f').rstrip('0').rstrip('.')
        except InvalidOperation:
            pass
    if percentage:
        parts.append(f"Percentage{' (calculated)' if calculated else ''}: {percentage.rstrip('%')}%")
    grade = first(records, 'overall_grade', 'final_grade', 'grade')
    if grade:
        parts.append(f"Grade: {grade}")
    classification = first(records, 'classification', 'division', 'result_class')
    if classification:
        parts.append(classification)
    if obtained and maximum:
        parts.append(f"Marks: {obtained}/{maximum}")
    return parts


def education_item(item):
    records = contexts(item)
    result = {
        'degree': first(records, 'degree', 'qualification', 'program', 'programme', 'course', 'class', 'standard'),
        'institution': first(records, 'institution', 'institution_name', 'college', 'college_name', 'school', 'school_name', 'university', 'board'),
        'year': first(records, 'year', 'academic_year', 'passing_year', 'completion_year', 'exam_year', 'date'),
        'details': text(item.get('details')),
    }
    details = [result['details']] if result['details'] else []
    for fact in academic_details(item):
        if not any(fact.casefold() in existing.casefold() for existing in details):
            details.append(fact)
    result['details'] = '; '.join(details)
    return result


def resume_data(structured):
    source = structured.get('resume_data')
    source = source if isinstance(source, dict) else structured
    personal = source.get('personal') or source.get('personal_info') or source.get('candidate') or {}
    personal = personal if isinstance(personal, dict) else {}
    result = {'personal': {key: text(personal.get(key)) for key in PERSONAL_FIELDS if text(personal.get(key))}}
    candidates = [personal, source, structured]
    for key in ('student_details', 'candidate_details', 'recipient', 'student', 'candidate'):
        if isinstance(structured.get(key), dict):
            candidates.append(structured[key])
    if not result['personal'].get('name'):
        name = first(candidates, 'recipient_name', 'candidate_name', 'student_name', 'participant_name', 'full_name')
        if not name:
            name = next((text(record.get('name')) for record in candidates if record is not structured and text(record.get('name'))), '')
        if name:
            result['personal']['name'] = name
    if not result['personal'].get('title'):
        title = first(candidates, 'profession', 'professional_title', 'occupation', 'designation')
        title = title or first(contexts(structured), 'field_of_study', 'specialization', 'discipline', 'branch')
        if title:
            result['personal']['title'] = title
    for key in ('email', 'phone', 'location', 'linkedin', 'github', 'website'):
        value = first(candidates, key)
        if value and key not in result['personal']:
            result['personal'][key] = value
    for section, fields in SECTION_FIELDS.items():
        items = source.get(section, structured.get(section, []))
        if isinstance(items, dict):
            items = [items]
        result[section] = []
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            clean = education_item(item) if section == 'education' else {field: text(item.get(field)) for field in fields}
            if any(clean.values()):
                result[section].append(clean)
    aggregate = education_item(structured)
    is_academic = bool(academic_details(structured)) or any(term in text(structured.get('document_type')).lower() for term in ('marksheet', 'mark sheet', 'transcript', 'academic', 'degree'))
    if is_academic and any(aggregate.values()):
        if not result['education']:
            result['education'].append(aggregate)
        elif len(result['education']) == 1:
            row = result['education'][0]
            for key in ('degree', 'institution', 'year'):
                row[key] = row[key] or aggregate[key]
            for detail in academic_details(structured):
                if detail.casefold() not in row['details'].casefold():
                    row['details'] = '; '.join(filter(None, [row['details'], detail]))
    for key in ('skills', 'achievements'):
        items = source.get(key, structured.get(key, []))
        if isinstance(items, str):
            items = [items]
        result[key] = list(dict.fromkeys(text(item) for item in items if text(item))) if isinstance(items, list) else []
    result['summary'] = text(source.get('summary')) or text(structured.get('summary'))
    if not result['achievements']:
        title = first([structured], 'certificate_title', 'course_name', 'certificate_name')
        if not is_academic:
            title = title or text(structured.get('title'))
        issuer = first([structured], 'issuer', 'organization')
        date = first([structured], 'issue_date', 'completion_date')
        if title:
            result['achievements'] = [' — '.join(filter(None, [title, issuer, date]))]
    return result


def combine_resume_data(profiles):
    """Merge owner-verified document facts, preserving distinct qualifications."""
    combined = {'personal': {}, 'summary': '', 'education': [], 'experience': [], 'projects': [], 'skills': [], 'achievements': []}
    for profile in profiles:
        for field in PERSONAL_FIELDS:
            value = text(profile.get('personal', {}).get(field))
            if not value:
                continue
            existing = combined['personal'].get(field)
            if field == 'name' and existing and ' '.join(existing.casefold().split()) != ' '.join(value.casefold().split()):
                raise ValueError('The selected documents contain different candidate names. Select documents for the same person.')
            if not existing:
                combined['personal'][field] = value
        for section in SECTION_FIELDS:
            for item in profile.get(section, []):
                if item not in combined[section]:
                    combined[section].append(item)
        for section in ('skills', 'achievements'):
            known = {item.casefold() for item in combined[section]}
            for item in profile.get(section, []):
                if item.casefold() not in known:
                    combined[section].append(item)
                    known.add(item.casefold())
    return combined

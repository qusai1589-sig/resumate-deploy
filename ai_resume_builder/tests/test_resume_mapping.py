import unittest
from resume_mapping import resume_data, combine_resume_data


class ResumeMappingTests(unittest.TestCase):
    def test_candidate_facts_only_and_correct_sections(self):
        result = resume_data({'document_type': 'Certificate', 'issuer': {'name': 'Trainer'}, 'resume_data': {
            'personal': {'name': 'Qusai Khanorwala', 'email': 'test@example.invalid'},
            'achievements': ['Completed Python Basics'], 'skills': ['Python', 'Python'],
            'education': [{'degree': 'BSc', 'institution': 'College', 'year': '2026'}],
            'experience': [{'role': 'Intern', 'company': 'Company'}],
            'projects': [{'name': 'Dashboard', 'technologies': 'Python'}],
        }})
        self.assertEqual(result['personal']['name'], 'Qusai Khanorwala')
        self.assertEqual(result['education'][0]['degree'], 'BSc')
        self.assertEqual(result['experience'][0]['role'], 'Intern')
        self.assertEqual(result['projects'][0]['name'], 'Dashboard')
        self.assertEqual(result['skills'], ['Python'])
        self.assertNotIn('phone', result['personal'])

    def test_legacy_recipient_is_supported_and_signatory_is_not_a_candidate(self):
        self.assertEqual(resume_data({'recipient_name': 'Qusai', 'certificate_name': 'Course', 'issuer': 'College'})['personal']['name'], 'Qusai')
        self.assertEqual(resume_data({'issuer': {'name': 'Trainer'}, 'signatory': {'name': 'Professor'}})['personal'], {})

    def test_unsupported_values_do_not_turn_into_facts(self):
        result = resume_data({'resume_data': {'personal': {'name': []}, 'education': ['invented'], 'skills': [{'skill': 'guess'}]}})
        self.assertEqual(result['personal'], {})
        self.assertEqual(result['education'], [])
        self.assertEqual(result['skills'], [])

    def test_marksheet_overall_scores_and_profession_survive_name_only_canonical_mapping(self):
        result = resume_data({'document_type': 'Marksheet',
            'student_details': {'full_name': 'Qusai', 'profession': 'Computer Engineer'},
            'academic_details': {'degree': 'B.E.', 'institution': 'Actual College', 'academic_year': 2026, 'cgpa': 9.3, 'overall_percentage': 89, 'overall_grade': 'A'},
            'resume_data': {'personal': {'name': 'Qusai'}}})
        self.assertEqual(result['personal']['title'], 'Computer Engineer')
        self.assertEqual(result['education'][0]['degree'], 'B.E.')
        self.assertEqual(result['education'][0]['year'], '2026')
        self.assertIn('CGPA: 9.3', result['education'][0]['details'])
        self.assertIn('Percentage: 89%', result['education'][0]['details'])
        self.assertIn('Grade: A', result['education'][0]['details'])

    def test_percentage_uses_explicit_totals_without_converting_cgpa_or_subject_grades(self):
        result = resume_data({'document_type': 'Marksheet', 'total_marks_obtained': 450, 'maximum_marks': 500})
        self.assertIn('Percentage (calculated): 90%', result['education'][0]['details'])
        only_gpa = resume_data({'document_type': 'Marksheet', 'cgpa': 9.3, 'subjects': [{'grade': 'A'}]})
        self.assertNotIn('Percentage', only_gpa['education'][0]['details'])
        self.assertNotIn('Grade:', only_gpa['education'][0]['details'])

    def test_canonical_education_numeric_values_are_retained(self):
        result = resume_data({'resume_data': {'education': [{'degree': 'Class XII', 'year': 2026, 'cgpa': 9.3, 'percentage': 85.5}]}})
        self.assertIn('CGPA: 9.3', result['education'][0]['details'])
        self.assertIn('Percentage: 85.5%', result['education'][0]['details'])

    def test_combining_rejects_different_candidates(self):
        with self.assertRaisesRegex(ValueError, 'different candidate names'):
            combine_resume_data([{'personal': {'name': 'Qusai'}}, {'personal': {'name': 'Another Person'}}])

if __name__ == '__main__':
    unittest.main()

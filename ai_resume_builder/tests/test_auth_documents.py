"""Local API integration tests; Supabase, OCR, and AI are replaced at their boundaries."""
import asyncio
import importlib
import sys
import types
import unittest
import uuid
from unittest.mock import patch

import httpx

# Keep these tests independent of OCR model loading and paid AI calls.
with patch.dict(sys.modules, {
    'ocr_engine': types.SimpleNamespace(run_ocr=lambda _: [{'text': 'Test certificate'}]),
    'ai_extraction': types.SimpleNamespace(
        extract_fields=lambda _: {'document_type': 'Certificate'},
        generate_resume_summary=lambda _: 'Test summary'),
}):
    api = importlib.import_module('app')

REAL_ASYNC_CLIENT = httpx.AsyncClient
USER = str(uuid.uuid4())
OTHER = str(uuid.uuid4())
DOCUMENT = str(uuid.uuid4())
TOKEN = 'local-test-token'


class FlowTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.rows = []
        self.objects = {}
        self.calls = []
        self.fail_insert = False
        self.unavailable = False

        def supabase(request):
            self.calls.append(request)
            if self.unavailable:
                raise httpx.ConnectError('Test network unavailable', request=request)
            path = request.url.path
            headers = request.headers
            if path == '/auth/v1/user':
                if headers.get('authorization') != f'Bearer {TOKEN}':
                    return httpx.Response(401, json={})
                return httpx.Response(200, json={'id': USER})
            if path in ('/auth/v1/token', '/auth/v1/signup'):
                return httpx.Response(200, json={
                    'user': {'id': USER, 'email': 'test@example.invalid'},
                    'access_token': TOKEN, 'refresh_token': 'test-refresh', 'expires_in': 3600})
            if path == '/rest/v1/documents':
                self.assertEqual(headers['authorization'], f'Bearer {TOKEN}')
                if request.method == 'POST':
                    if self.fail_insert:
                        return httpx.Response(403, json={})
                    import json
                    row = json.loads(request.content)
                    self.assertEqual(row['user_id'], USER)
                    self.assertTrue(row['file_path'].startswith(USER + '/'))
                    row.update(id=DOCUMENT, uploaded_at='2026-10-04T00:00:00Z')
                    self.rows.append(row)
                    return httpx.Response(201, json=[row])
                self.assertEqual(request.url.params['user_id'], f'eq.{USER}')
                rows = [row for row in self.rows if row['user_id'] == USER]
                if 'id' in request.url.params:
                    rows = [row for row in rows if 'eq.' + row['id'] == request.url.params['id']]
                return httpx.Response(200, json=rows)
            if path.startswith('/storage/v1/object/'):
                self.assertEqual(headers['authorization'], f'Bearer {TOKEN}')
                if request.method == 'POST':
                    self.objects[path.removeprefix('/storage/v1/object/uploads/')] = request.content
                    return httpx.Response(200, json={})
                if request.method == 'DELETE':
                    import json
                    for key in json.loads(request.content)['prefixes']:
                        self.objects.pop(key, None)
                    return httpx.Response(200, json={})
                key = path.removeprefix('/storage/v1/object/authenticated/uploads/')
                return httpx.Response(200, content=self.objects[key]) if key in self.objects else httpx.Response(404)
            raise AssertionError('Unexpected service endpoint')

        self.remote = httpx.MockTransport(supabase)
        self.patch = patch.object(api.httpx, 'AsyncClient', side_effect=lambda **kw: REAL_ASYNC_CLIENT(transport=self.remote, **kw))
        self.patch.start()
        async def direct_pipeline(function, *args):
            return function(*args)
        self.pipeline_patch = patch.object(api, 'run_in_threadpool', direct_pipeline)
        self.pipeline_patch.start()
        self.client = REAL_ASYNC_CLIENT(transport=httpx.ASGITransport(app=api.app), base_url='http://local.test')
        self.auth = {'Authorization': f'Bearer {TOKEN}'}

    async def asyncTearDown(self):
        await self.client.aclose()
        self.patch.stop()
        self.pipeline_patch.stop()

    async def test_signup_login_upload_list_private_download(self):
        for endpoint in ('/signup', '/login'):
            response = await self.client.post(endpoint, json={'email': 'test@example.invalid', 'password': 'test-password'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['refresh_token'], 'test-refresh')
            self.assertEqual(response.json()['expires_in'], 3600)
        contents = b'%PDF-1.4\nlocal test fixture'
        response = await self.client.post('/upload', headers=self.auth, files=[('files', ('certificate.pdf', contents, 'application/pdf'))])
        self.assertEqual(response.json()['successful_files'], 1)
        self.assertEqual(response.json()['results'][0]['document_id'], DOCUMENT)
        listing = await self.client.get('/documents', headers=self.auth)
        self.assertEqual(len(listing.json()['documents']), 1)
        download = await self.client.get(f'/documents/{DOCUMENT}/file', headers=self.auth)
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.content, contents)
        self.assertIn('attachment;', download.headers['content-disposition'])
        self.assertFalse((api.UPLOAD_FOLDER / response.json()['results'][0]['stored_filename']).exists())

    async def test_missing_invalid_and_unavailable_auth(self):
        for endpoint in ('/documents', f'/documents/{DOCUMENT}/file'):
            self.assertEqual((await self.client.get(endpoint)).status_code, 401)
            self.assertEqual((await self.client.get(endpoint, headers={'Authorization': 'Bearer invalid'})).status_code, 401)
        self.assertEqual((await self.client.post('/upload', files={'files': ('test.pdf', b'%PDF-')})).status_code, 401)
        self.unavailable = True
        self.assertEqual((await self.client.get('/documents', headers=self.auth)).status_code, 503)

    async def test_other_owner_hidden_and_wrong_storage_prefix_rejected(self):
        self.rows.append({'id': DOCUMENT, 'user_id': OTHER, 'file_name': 'private.pdf', 'file_path': f'{OTHER}/private.pdf', 'mime_type': 'application/pdf'})
        self.assertEqual((await self.client.get('/documents', headers=self.auth)).json()['documents'], [])
        self.assertEqual((await self.client.get(f'/documents/{DOCUMENT}/file', headers=self.auth)).status_code, 404)
        self.rows[0]['user_id'] = USER
        self.assertEqual((await self.client.get(f'/documents/{DOCUMENT}/file', headers=self.auth)).status_code, 404)
        self.assertFalse(any('/authenticated/' in call.url.path for call in self.calls))

    async def test_validation_partial_upload_and_insert_cleanup(self):
        response = await self.client.post('/upload', headers=self.auth, files=[
            ('files', ('good.pdf', b'%PDF-1.4 test')), ('files', ('bad.pdf', b'not a pdf'))])
        self.assertEqual(response.json()['successful_files'], 1)
        self.assertEqual(response.json()['failed_files'], 1)
        self.fail_insert = True
        old_objects = dict(self.objects)
        response = await self.client.post('/upload', headers=self.auth, files={'files': ('next.pdf', b'%PDF-1.4 test')})
        self.assertEqual(response.json()['results'][0]['error'], 'Processing failed')
        self.assertEqual(self.objects, old_objects)
        response = await self.client.post('/upload', headers=self.auth, files=[('files', ('a.pdf', b'%PDF-'))] * 6)
        self.assertEqual(response.status_code, 400)

    async def test_extraction_survives_vault_reload_and_old_uploads_are_reprocessed(self):
        structured = {'document_type': 'Certificate', 'resume_data': {
            'personal': {'name': 'Qusai Khanorwala'},
            'achievements': ['Completed Python Basics — Test Institute'],
        }}
        with patch.object(api, 'extract_fields', return_value=structured):
            response = await self.client.post('/upload', headers=self.auth, files={'files': ('scan.png', b'\x89PNG\r\n\x1a\nfixture')})
        self.assertEqual(response.json()['results'][0]['resume_data']['personal']['name'], 'Qusai Khanorwala')
        original_path = self.rows[0]['file_path']
        self.assertIn(original_path + '.extraction.json', self.objects)
        with patch.object(api, 'run_ocr', side_effect=AssertionError('Cached extraction must be reused')):
            analysis = await self.client.post(f'/documents/{DOCUMENT}/extraction', headers=self.auth)
        self.assertEqual(analysis.status_code, 200)
        self.assertEqual(analysis.json()['resume_data']['personal']['name'], 'Qusai Khanorwala')
        self.objects.pop(original_path + '.extraction.json')
        with patch.object(api, 'extract_fields', return_value=structured):
            legacy = await self.client.post(f'/documents/{DOCUMENT}/extraction', headers=self.auth)
        self.assertEqual(legacy.status_code, 200)
        self.assertEqual(legacy.json()['resume_data']['personal']['name'], 'Qusai Khanorwala')
        self.assertIn(original_path + '.extraction.json', self.objects)

    async def test_old_cached_extraction_is_refreshed_with_new_mapping(self):
        response = await self.client.post('/upload', headers=self.auth, files={'files': ('marks.pdf', b'%PDF-1.4 fixture')})
        self.assertEqual(response.json()['successful_files'], 1)
        key = self.rows[0]['file_path'] + '.extraction.json'
        import json
        self.objects[key] = json.dumps({'resume_data': {'personal': {'name': 'Qusai'}}}).encode()
        with patch.object(api, 'extract_fields', return_value={'document_type': 'Marksheet', 'student_name': 'Qusai', 'cgpa': 9.3}), patch.object(api, 'run_ocr', return_value=[{'text': 'Qusai CGPA 9.3'}]) as scan:
            response = await self.client.post(f'/documents/{DOCUMENT}/extraction', headers=self.auth)
        self.assertEqual(response.status_code, 200)
        scan.assert_called_once()
        self.assertIn('CGPA: 9.3', response.json()['resume_data']['education'][0]['details'])
        self.assertEqual(response.json()['mapping_version'], api.MAPPING_VERSION)

    async def test_extraction_requires_owner_and_returns_readable_errors(self):
        self.assertEqual((await self.client.post(f'/documents/{DOCUMENT}/extraction')).status_code, 401)
        self.rows.append({'id': DOCUMENT, 'user_id': OTHER, 'file_name': 'private.pdf', 'file_path': f'{OTHER}/private.pdf', 'mime_type': 'application/pdf'})
        self.assertEqual((await self.client.post(f'/documents/{DOCUMENT}/extraction', headers=self.auth)).status_code, 404)
        self.assertFalse(any('/authenticated/' in call.url.path for call in self.calls))
        self.rows[0].update(user_id=USER, file_path=f'{USER}/scan.pdf')
        self.objects[f'{USER}/scan.pdf'] = b'%PDF-1.4 fixture'
        with patch.object(api, 'run_ocr', return_value=[]):
            self.assertEqual((await self.client.post(f'/documents/{DOCUMENT}/extraction', headers=self.auth)).status_code, 422)

    async def test_combines_owner_documents_into_one_ai_summary_and_full_resume(self):
        second = str(uuid.uuid4())
        import json
        for index, identifier in enumerate((DOCUMENT, second)):
            path = f'{USER}/certificate-{index}.pdf'
            self.rows.append({'id': identifier, 'user_id': USER, 'file_name': f'certificate-{index}.pdf', 'file_path': path, 'mime_type': 'application/pdf'})
            profile = {'personal': {'name': 'Qusai'}, 'skills': ['Python'], 'achievements': [f'Certificate {index + 1}']}
            if index == 1:
                profile['education'] = [{'degree': 'B.E.', 'details': 'CGPA: 9.3'}]
            self.objects[path + '.extraction.json'] = json.dumps({'mapping_version': api.MAPPING_VERSION, 'resume_data': profile}).encode()
        with patch.object(api, 'generate_resume_summary', return_value='Qusai completed two certificates and achieved a CGPA of 9.3.') as summary:
            response = await self.client.post('/documents/combine', headers=self.auth, json={'document_ids': [DOCUMENT, second]})
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['resume_data']['achievements'], ['Certificate 1', 'Certificate 2'])
        self.assertEqual(result['resume_data']['skills'], ['Python'])
        self.assertIn('9.3', result['resume_data']['education'][0]['details'])
        self.assertEqual(result['resume_data']['summary'], result['resume_summary'])
        self.assertEqual(len(summary.call_args.args[0]['achievements']), 2)

    async def test_combine_rejects_foreign_documents_duplicates_and_invalid_count(self):
        second = str(uuid.uuid4())
        self.rows.append({'id': DOCUMENT, 'user_id': USER, 'file_name': 'a.pdf', 'file_path': f'{USER}/a.pdf', 'mime_type': 'application/pdf'})
        self.rows.append({'id': second, 'user_id': OTHER, 'file_name': 'b.pdf', 'file_path': f'{OTHER}/b.pdf', 'mime_type': 'application/pdf'})
        with patch.object(api, 'generate_resume_summary') as summary:
            response = await self.client.post('/documents/combine', headers=self.auth, json={'document_ids': [DOCUMENT, second]})
        self.assertEqual(response.status_code, 404)
        summary.assert_not_called()
        self.assertFalse(any('/authenticated/' in call.url.path for call in self.calls))
        response = await self.client.post('/documents/combine', headers=self.auth, json={'document_ids': [DOCUMENT, DOCUMENT]})
        self.assertEqual(response.status_code, 400)
        response = await self.client.post('/documents/combine', headers=self.auth, json={'document_ids': [DOCUMENT]})
        self.assertEqual(response.status_code, 422)
        self.assertEqual((await self.client.post('/documents/combine', json={'document_ids': [DOCUMENT, second]})).status_code, 401)

    async def test_combined_summary_failure_is_reported_instead_of_using_individual_summaries(self):
        identifiers = [DOCUMENT, str(uuid.uuid4())]
        import json
        for identifier in identifiers:
            path = f'{USER}/{identifier}.pdf'
            self.rows.append({'id': identifier, 'user_id': USER, 'file_name': 'a.pdf', 'file_path': path, 'mime_type': 'application/pdf'})
            self.objects[path + '.extraction.json'] = json.dumps({'mapping_version': api.MAPPING_VERSION, 'resume_data': {'personal': {'name': 'Qusai'}}}).encode()
        with patch.object(api, 'generate_resume_summary', return_value=''):
            response = await self.client.post('/documents/combine', headers=self.auth, json={'document_ids': identifiers})
        self.assertEqual(response.status_code, 503)

    async def test_cors_and_public_config(self):
        response = await self.client.options('/documents', headers={
            'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization'})
        self.assertEqual(response.status_code, 200)
        response = await self.client.options('/documents', headers={
            'Origin': 'http://untrusted.example', 'Access-Control-Request-Method': 'GET'})
        self.assertEqual(response.status_code, 400)
        config = (await self.client.get('/auth/config')).json()
        self.assertEqual(set(config), {'url', 'anon_key'})
        response = await self.client.post('/signup', json={'email': 'test@example.invalid', 'password': 'short'})
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()

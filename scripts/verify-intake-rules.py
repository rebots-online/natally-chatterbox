import json
import pathlib
import subprocess
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
config = json.loads((root / 'firebase-applet-config.json').read_text())
project = config['projectId']
database = config['firestoreDatabaseId']
token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
profile = {
    'name': 'Test profile', 'birthDate': '2000-01-01', 'birthTime': '12:00',
    'placeName': 'Test place', 'latitude': 0, 'longitude': 0,
    'timezoneOffset': 0, 'houseSystem': 'W', 'birthTimeUnknown': True,
}
cases = []
labels = []


def case(label, method, uid, owner='alice', data=None, suffix='private/intake', allow=False):
    request = {
        'path': f'/databases/{database}/documents/users/{owner}/{suffix}',
        'method': method, 'auth': {'uid': uid} if uid else None,
    }
    if data is not None:
        request['resource'] = {'data': data}
    cases.append({'request': request, 'expectation': 'ALLOW' if allow else 'DENY'})
    labels.append(label)


case('owner reads own profile', 'get', 'alice', allow=True)
case('another account cannot read', 'get', 'bob')
case('signed out cannot read', 'get', None)
case('owner creates own profile', 'create', 'alice', data=profile, allow=True)
case('owner updates own profile', 'update', 'alice', data=profile, allow=True)
case('another account cannot write', 'create', 'bob', data=profile)
case('signed out cannot write', 'create', None, data=profile)
case('credits cannot be granted through intake', 'create', 'alice', data={**profile, 'credits': 100})
case('invalid profile is rejected', 'create', 'alice', data={**profile, 'latitude': 100})
case('owner may delete own profile', 'delete', 'alice', allow=True)
case('another account cannot delete', 'delete', 'bob')
case('other private documents remain denied', 'get', 'alice', suffix='private/billing')
case('lore remains denied until separately implemented', 'get', 'alice', suffix='lore/test')
body = {'source': {'files': [{'name': 'intake.rules', 'content': (root / 'firebase/intake.rules').read_text()}]}, 'testSuite': {'testCases': cases}}
request = urllib.request.Request(
    f'https://firebaserules.googleapis.com/v1/projects/{project}:test',
    data=json.dumps(body).encode(),
    headers={'Authorization': 'Bearer ' + token, 'x-goog-user-project': project, 'Content-Type': 'application/json'},
)
with urllib.request.urlopen(request, timeout=60) as response:
    result = json.load(response)
failures = [issue for issue in result.get('issues', []) if issue.get('severity') == 'ERROR']
results = result.get('testResults', [])
for label, outcome in zip(labels, results):
    print(label + ': ' + outcome.get('state', 'MISSING'))
    if outcome.get('state') != 'SUCCESS':
        failures.append(outcome)
if len(results) != len(cases):
    failures.append({'expected': len(cases), 'actual': len(results)})
if failures:
    print(json.dumps(failures, indent=2))
    raise SystemExit(1)
print(f'{len(results)} Firebase rules evaluations passed; no release changed.')

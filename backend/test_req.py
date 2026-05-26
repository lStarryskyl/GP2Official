import requests

resp = requests.post('http://localhost:8000/api/auth/login', data={'username':'test_agent_12345@gmail.com', 'password':'Password123'})
token = resp.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

create_resp = requests.post('http://localhost:8000/api/projects/', headers=headers, json={"name": "Debate Test Proj", "description": "Test"})
proj_id = create_resp.json().get('id')
print("Created Project:", proj_id)

data = {
    "topic": "Project Plan Architecture Review",
    "max_rounds": 2
}
debate_resp = requests.post(f'http://localhost:8000/api/projects/{proj_id}/debate', headers=headers, json=data)
print("Status:", debate_resp.status_code)
print("Body:", debate_resp.text)

import urllib.request
import json
import urllib.parse

def get_ddg_image(query):
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'SkillSnapBot/1.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data.get('Image')
    except Exception as e:
        print(f"Error: {e}")
    return None

print(get_ddg_image("Photosynthesis"))

import urllib.request
import json
import urllib.parse

def get_wiki_image(topic):
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(topic)}&prop=pageimages&format=json&pithumbsize=800"
        req = urllib.request.Request(url, headers={'User-Agent': 'SkillSnapBot/1.0 (contact: test@example.com)'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for page_id in pages:
                thumbnail = pages[page_id].get('thumbnail', {})
                return thumbnail.get('source')
    except Exception as e:
        print(f"Error: {e}")
    return None

print(get_wiki_image("Photosynthesis"))

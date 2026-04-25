import urllib.request
import json
import urllib.parse

def get_best_image(query):
    # Try DuckDuckGo Abstract Image
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if data.get('Image'):
                return "https://duckduckgo.com" + data.get('Image')
    except: pass
    
    # Try Wikipedia Page Image
    try:
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(query)}&prop=pageimages&format=json&pithumbsize=800&redirects=1"
        req = urllib.request.Request(wiki_url, headers={'User-Agent': 'SkillSnap/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for page_id in pages:
                if 'thumbnail' in pages[page_id]:
                    return pages[page_id]['thumbnail']['source']
    except: pass
    
    return None

print(f"AI: {get_best_image('Artificial Intelligence')}")
print(f"Photosynthesis: {get_best_image('Photosynthesis')}")

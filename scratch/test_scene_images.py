import urllib.request
import json
import urllib.parse

def get_page_image(query):
    try:
        # Search for the most relevant page first
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&srlimit=1"
        req = urllib.request.Request(search_url, headers={'User-Agent': 'SkillSnap/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            search_results = data.get('query', {}).get('search', [])
            if search_results:
                title = search_results[0].get('title')
                
                # Now get the page image for that title
                img_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=800&redirects=1"
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'SkillSnap/1.0'})
                with urllib.request.urlopen(img_req, timeout=5) as img_res:
                    img_data = json.loads(img_res.read().decode())
                    pages = img_data.get('query', {}).get('pages', {})
                    for page_id in pages:
                        if 'thumbnail' in pages[page_id]:
                            return pages[page_id]['thumbnail']['source']
    except Exception as e:
        print(f"Error: {e}")
    return None

print(f"Calvin Cycle: {get_page_image('Calvin Cycle')}")
print(f"Chloroplast: {get_page_image('Chloroplast')}")
print(f"Stomata: {get_page_image('Stomata')}")

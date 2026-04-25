import urllib.request
import json
import urllib.parse

def get_wikipedia_page_images(topic):
    try:
        # Step 1: Get the list of image titles used on the page
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(topic)}&prop=images&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'SkillSnap/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for page_id in pages:
                images = pages[page_id].get('images', [])
                # Filter for useful extensions (skip icons/SVG mostly if we want photos, but SVG are good for diagrams)
                useful_images = [img.get('title') for img in images if not any(x in img.get('title').lower() for x in ['icon', 'logo', 'edit', 'stub'])]
                return useful_images
    except Exception as e:
        print(f"Error: {e}")
    return []

print(get_wikipedia_page_images("Photosynthesis"))

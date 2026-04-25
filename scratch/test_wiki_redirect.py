import urllib.request
import urllib.parse
import json

def get_wikipedia_file_url(query):
    try:
        # Step 1: Search for files related to the query
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&format=json&srlimit=1"
        req = urllib.request.Request(search_url, headers={'User-Agent': 'SkillSnap/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            search_results = data.get('query', {}).get('search', [])
            if search_results:
                filename = search_results[0].get('title')
                if filename.startswith("File:"):
                    filename = filename[5:] # Remove "File:" prefix
                
                # Step 2: Use Special:Redirect to get the actual image data
                redirect_url = f"https://en.wikipedia.org/wiki/Special:Redirect/file/{urllib.parse.quote(filename)}"
                return redirect_url
    except Exception as e:
        print(f"Error: {e}")
    return None

print(f"Photosynthesis diagram: {get_wikipedia_file_url('photosynthesis diagram')}")
print(f"Solar system: {get_wikipedia_file_url('solar system')}")

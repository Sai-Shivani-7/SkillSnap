import urllib.request
import urllib.parse
import re

def get_bing_image(query):
    try:
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&form=HDRSC2&first=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            # Look for murl (Media URL) in the JSON-like data-src or m attributes
            # Bing uses "m":"{\"sid\":\"\",\"mid\":\"\",\"murl\":\"https:\/\/...\"}"
            matches = re.findall(r'"murl":"(http[^"]+)"', html)
            if matches:
                # Unescape backslashes
                return matches[0].replace('\\/', '/')
    except Exception as e:
        print(f"Error: {e}")
    return None

print(get_bing_image("photosynthesis diagram"))

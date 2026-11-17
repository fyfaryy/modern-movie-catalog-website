import json, re, html, subprocess, concurrent.futures
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTERS = ROOT / 'public' / 'posters'
IMAGES = ROOT / 'public' / 'images'
FONTS = ROOT / 'public' / 'fonts'
for folder in [POSTERS, IMAGES, FONTS]:
    folder.mkdir(parents=True, exist_ok=True)

def fetch(url):
    result = subprocess.run(['curl', '-fsSL', '--retry', '1', '--max-time', '30', url], capture_output=True)
    return result.stdout if result.returncode == 0 else b''

def movie_poster(film):
    target = POSTERS / (film['id'] + '.jpg')
    if target.exists() and target.stat().st_size > 1000:
        return film['id'] + ' cached'
    direct = {
        'film-23': 'https://static.kinoafisha.info/k/movie_posters/1080x1920/upload/movie_posters/6/0/6/8368606/226094177580.jpg',
        'film-37': 'https://upload.wikimedia.org/wikipedia/en/1/10/Tarot_Teaser_Poster.jpg',
        'film-38': 'https://upload.wikimedia.org/wikipedia/en/7/7f/Smile_%282022_film%29.jpg',
        'film-42': 'https://upload.wikimedia.org/wikipedia/en/1/11/Resident_Evil_%282002%29_HQ_Movie_Poster.jpg',
        'film-53': 'https://www.impawards.com/intl/mexico/2022/posters/mal_de_ojo_ver2.jpg',
        'film-56': 'https://upload.wikimedia.org/wikipedia/id/a/aa/Poster_Kuasa_Gelap.jpg',
        'film-68': 'https://upload.wikimedia.org/wikipedia/id/5/5c/Poster_Qodrat_2.jpg',
    }
    if film['id'] in direct:
        image = fetch(direct[film['id']])
        if len(image) > 1000 and (image[:2] == b'\xff\xd8' or image[:4] == b'\x89PNG'):
            target.write_bytes(image)
            return film['id'] + ' saved (verified source)'
    page = fetch('https://en.wikipedia.org/wiki/' + film['wiki']).decode('utf-8', errors='ignore')
    match = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)', page)
    if not match:
        match = re.search(r'<meta\s+content="([^"]+)"\s+property="og:image"', page)
    if match:
        url = html.unescape(match.group(1)).split('?')[0]
        image = fetch(url)
        if len(image) > 1000 and (image[:2] == b'\xff\xd8' or image[:4] == b'\x89PNG' or image[:4] == b'RIFF'):
            target.write_bytes(image)
            return film['id'] + ' saved'
    return film['id'] + ' MISSING: ' + film['wiki']

films = json.loads((ROOT / 'src/data/films.json').read_text())
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for result in pool.map(movie_poster, films):
        print(result, flush=True)

hero = fetch('https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg')
if hero:
    (IMAGES / 'interstellar.jpg').write_bytes(hero)
    print('Hero saved:', len(hero), flush=True)
font = fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf')
if len(font) > 1000:
    (FONTS / 'Manrope-Variable.ttf').write_bytes(font)
    print('Font saved:', len(font), flush=True)
print('Posters:', len(list(POSTERS.glob('*.jpg'))), '/', len(films))

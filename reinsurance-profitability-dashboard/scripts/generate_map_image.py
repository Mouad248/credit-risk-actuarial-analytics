#!/usr/bin/env python3
"""
Script pour générer une image de carte du monde basique
Nécessite: pip install Pillow
"""

from PIL import Image, ImageDraw
import os

def create_world_map():
    # Créer une image 1200x600 pixels
    width, height = 1200, 600
    img = Image.new('RGB', (width, height), color='#f1f5f9')  # Fond bleu clair
    draw = ImageDraw.Draw(img)
    
    # Couleurs
    land_color = '#e2e8f0'  # Gris clair pour les continents
    border_color = '#cbd5e1'  # Gris pour les bordures
    
    # Dessiner des formes simplifiées pour les continents
    
    # Amérique du Nord
    north_america = [
        (100, 100), (180, 80), (250, 100), (320, 120), 
        (300, 180), (250, 200), (180, 180), (120, 160)
    ]
    draw.polygon(north_america, fill=land_color, outline=border_color)
    
    # Amérique du Sud
    south_america = [
        (200, 250), (280, 240), (300, 280), (320, 350),
        (300, 420), (280, 450), (250, 460), (220, 450),
        (200, 420), (180, 380), (190, 320), (195, 280)
    ]
    draw.polygon(south_america, fill=land_color, outline=border_color)
    
    # Europe
    europe = [
        (480, 80), (520, 70), (560, 80), (580, 100),
        (570, 120), (550, 130), (520, 125), (490, 120)
    ]
    draw.polygon(europe, fill=land_color, outline=border_color)
    
    # Afrique
    africa = [
        (500, 140), (540, 130), (580, 150), (600, 200),
        (590, 280), (580, 350), (560, 400), (540, 420),
        (520, 415), (500, 400), (480, 350), (470, 280),
        (475, 200), (485, 160)
    ]
    draw.polygon(africa, fill=land_color, outline=border_color)
    
    # Asie
    asia = [
        (620, 60), (700, 50), (780, 70), (850, 90),
        (920, 110), (950, 140), (930, 180), (900, 200),
        (850, 180), (800, 160), (750, 150), (700, 140),
        (650, 130), (630, 100)
    ]
    draw.polygon(asia, fill=land_color, outline=border_color)
    
    # Asie du Sud-Est
    asia_se = [
        (780, 200), (820, 190), (860, 210), (880, 240),
        (870, 270), (850, 280), (820, 275), (790, 260),
        (785, 230)
    ]
    draw.polygon(asia_se, fill=land_color, outline=border_color)
    
    # Australie
    australia = [
        (800, 350), (860, 340), (900, 360), (890, 390),
        (860, 400), (820, 395), (800, 380)
    ]
    draw.polygon(australia, fill=land_color, outline=border_color)
    
    # Groenland
    greenland = [
        (350, 30), (380, 25), (400, 35), (395, 55),
        (380, 65), (360, 60), (350, 45)
    ]
    draw.polygon(greenland, fill=land_color, outline=border_color)
    
    # Dessiner des lignes de grille (longitude/latitude)
    grid_color = '#e2e8f0'
    
    # Lignes verticales (longitude)
    for x in range(0, width + 1, width // 8):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    
    # Lignes horizontales (latitude)
    for y in range(0, height + 1, height // 6):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)
    
    # Équateur (ligne plus marquée)
    equator_y = height // 2
    draw.line([(0, equator_y), (width, equator_y)], fill='#94a3b8', width=2)
    
    # Méridien de Greenwich
    meridian_x = width // 2
    draw.line([(meridian_x, 0), (meridian_x, height)], fill='#94a3b8', width=2)
    
    return img

def main():
    try:
        print("🌍 Génération de l'image de carte du monde...")
        
        # Créer l'image
        img = create_world_map()
        
        # Sauvegarder dans le dossier public
        output_path = os.path.join('public', 'worldmap-bg.png')
        img.save(output_path, 'PNG', quality=95)
        
        print(f"✅ Image créée avec succès : {output_path}")
        print(f"📏 Taille : {img.size[0]}x{img.size[1]} pixels")
        print("🔄 Rechargez votre navigateur pour voir la carte !")
        
    except ImportError:
        print("❌ Erreur : Le module Pillow n'est pas installé")
        print("💡 Installez-le avec : pip install Pillow")
        print("   Puis relancez ce script")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'image : {e}")

if __name__ == "__main__":
    main()

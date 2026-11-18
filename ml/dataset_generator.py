"""Indian Residential Housing Dataset Generator.

Generates a realistic, high-fidelity Indian property dataset
covering key metro and tier-1/tier-2 cities (Ahmedabad, Surat, Vadodara,
Mumbai, Pune, Bangalore, Delhi, Hyderabad, Chennai, Kolkata) based on
authentic real estate per-sqft market benchmark rates.
"""

import os
import random
import numpy as np
import pandas as pd

# Set reproducible seed
np.random.seed(42)
random.seed(42)

CITIES_DATA = {
    "Ahmedabad": {
        "state": "Gujarat",
        "localities": {
            "Bodakdev": (6800, 9500),
            "Satellite": (6200, 8600),
            "Vastrapur": (5900, 8200),
            "Thaltej": (6400, 9100),
            "Prahlad Nagar": (6600, 9300),
            "Bopal": (4200, 5800),
            "Gota": (3800, 5200),
            "Chandkheda": (3600, 4800),
            "SG Highway": (5200, 7600),
        }
    },
    "Surat": {
        "state": "Gujarat",
        "localities": {
            "Vesu": (4600, 7500),
            "Adajan": (3800, 5800),
            "Pal": (3500, 5200),
            "Piplod": (4200, 6600),
            "City Light": (4800, 7200),
            "Varachha": (3200, 4600),
        }
    },
    "Vadodara": {
        "state": "Gujarat",
        "localities": {
            "Alkapuri": (5100, 7500),
            "Gotri": (3600, 5000),
            "Vasna": (3800, 5400),
            "Manjalpur": (3200, 4600),
            "Karelibaug": (3400, 4800),
            "Sama": (3500, 4900),
        }
    },
    "Mumbai": {
        "state": "Maharashtra",
        "localities": {
            "Bandra West": (33000, 56000),
            "Andheri West": (21000, 32000),
            "Powai": (18500, 28000),
            "Juhu": (31000, 53000),
            "Borivali West": (15500, 24000),
            "Dadar": (24500, 38500),
            "Worli": (35000, 62000),
            "Thane West": (10500, 16500),
        }
    },
    "Pune": {
        "state": "Maharashtra",
        "localities": {
            "Kothrud": (8200, 12800),
            "Hinjewadi": (5600, 8600),
            "Wakad": (6200, 9200),
            "Baner": (7600, 11800),
            "Viman Nagar": (8600, 13200),
            "Kharadi": (6600, 9600),
            "Hadapsar": (5200, 7900),
        }
    },
    "Bangalore": {
        "state": "Karnataka",
        "localities": {
            "Whitefield": (6600, 10800),
            "Koramangala": (11500, 18500),
            "Indiranagar": (12500, 20500),
            "HSR Layout": (8800, 13800),
            "Electronic City": (4900, 7400),
            "Jayanagar": (10200, 16200),
            "Bellandur": (7200, 11200),
        }
    },
    "Delhi": {
        "state": "Delhi",
        "localities": {
            "Connaught Place": (23000, 41000),
            "Greater Kailash": (16500, 28500),
            "Dwarka": (8200, 13800),
            "Rohini": (7600, 12200),
            "Saket": (14500, 24500),
            "Vasant Kunj": (15500, 26500),
            "Hauz Khas": (18500, 30500),
        }
    },
    "Hyderabad": {
        "state": "Telangana",
        "localities": {
            "Gachibowli": (7200, 11800),
            "Hitec City": (7800, 12800),
            "Jubilee Hills": (13500, 22500),
            "Banjara Hills": (12500, 20500),
            "Madhapur": (7400, 12000),
            "Kondapur": (6600, 10200),
        }
    },
    "Chennai": {
        "state": "Tamil Nadu",
        "localities": {
            "Anna Nagar": (9800, 15500),
            "T Nagar": (10800, 17500),
            "Adyar": (11200, 18500),
            "Velachery": (6600, 9800),
            "OMR": (5200, 8200),
            "Porur": (5400, 8000),
        }
    },
    "Kolkata": {
        "state": "West Bengal",
        "localities": {
            "Salt Lake": (6800, 10800),
            "New Town": (5200, 8200),
            "Ballygunge": (10500, 16800),
            "Alipore": (12500, 20500),
            "Rajarhat": (4600, 7200),
        }
    }
}

PROPERTY_TYPES = {
    "Apartment": 1.00,
    "Independent House": 1.18,
    "Villa": 1.35,
    "Penthouse": 1.50
}

FURNISHING_STATUS = {
    "Unfurnished": 1.00,
    "Semi-Furnished": 1.08,
    "Furnished": 1.18
}

def generate_dataset(num_records=4500):
    rows = []
    
    cities = list(CITIES_DATA.keys())
    # Slightly higher weighting on top economic hubs and Gujarat cities (as requested)
    weights = [0.15, 0.08, 0.07, 0.16, 0.12, 0.14, 0.12, 0.08, 0.04, 0.04]
    
    for _ in range(num_records):
        city = random.choices(cities, weights=weights)[0]
        city_info = CITIES_DATA[city]
        state = city_info["state"]
        
        locality = random.choice(list(city_info["localities"].keys()))
        min_base, max_base = city_info["localities"][locality]
        
        # Area and bedrooms logic
        bedrooms = random.choices([1, 2, 3, 4, 5], weights=[0.12, 0.38, 0.35, 0.12, 0.03])[0]
        
        # Realistic sqft according to bedrooms
        if bedrooms == 1:
            area_sqft = int(np.random.normal(580, 80))
            bathrooms = 1
            area_sqft = max(420, min(area_sqft, 800))
        elif bedrooms == 2:
            area_sqft = int(np.random.normal(1050, 140))
            bathrooms = random.choices([1, 2], weights=[0.15, 0.85])[0]
            area_sqft = max(750, min(area_sqft, 1400))
        elif bedrooms == 3:
            area_sqft = int(np.random.normal(1600, 220))
            bathrooms = random.choices([2, 3, 4], weights=[0.20, 0.70, 0.10])[0]
            area_sqft = max(1200, min(area_sqft, 2400))
        elif bedrooms == 4:
            area_sqft = int(np.random.normal(2400, 350))
            bathrooms = random.choices([3, 4, 5], weights=[0.25, 0.65, 0.10])[0]
            area_sqft = max(1800, min(area_sqft, 3800))
        else: # 5 BHK
            area_sqft = int(np.random.normal(3600, 500))
            bathrooms = random.choices([4, 5, 6], weights=[0.20, 0.65, 0.15])[0]
            area_sqft = max(2600, min(area_sqft, 5800))
            
        # Property type
        if bedrooms >= 4:
            prop_type = random.choices(
                ["Apartment", "Independent House", "Villa", "Penthouse"],
                weights=[0.30, 0.25, 0.30, 0.15]
            )[0]
        elif bedrooms == 1:
            prop_type = "Apartment"
        else:
            prop_type = random.choices(
                ["Apartment", "Independent House", "Villa", "Penthouse"],
                weights=[0.75, 0.15, 0.06, 0.04]
            )[0]
            
        furnishing = random.choices(
            ["Unfurnished", "Semi-Furnished", "Furnished"],
            weights=[0.30, 0.50, 0.20]
        )[0]
        
        # Floors
        if prop_type in ["Villa", "Independent House"]:
            floors = random.choice([1, 2, 3])
        else:
            floors = random.randint(1, 25)
            
        # Parking
        if prop_type in ["Villa", "Independent House", "Penthouse"] or bedrooms >= 3:
            parking = random.choices([1, 2, 3], weights=[0.40, 0.45, 0.15])[0]
        else:
            parking = random.choices([0, 1, 2], weights=[0.25, 0.65, 0.10])[0]
            
        # Property age (0 = brand new/under construction to 25 years)
        property_age = int(np.random.exponential(scale=6))
        property_age = min(property_age, 30)
        
        # Price Calculation Model based on Indian property factors
        base_rate_sqft = np.random.uniform(min_base, max_base)
        
        # Multipliers
        type_mult = PROPERTY_TYPES[prop_type]
        furn_mult = FURNISHING_STATUS[furnishing]
        
        # Age depreciation: roughly 0.6% per year up to max 20%
        age_factor = max(0.80, 1.0 - (property_age * 0.006))
        
        # Floor factor: slight floor rise in high-rises (e.g. 0.2% per floor above 3rd)
        floor_factor = 1.0 + (min(floors, 20) * 0.003) if prop_type == "Apartment" else 1.0
        
        # Parking bonus
        parking_factor = 1.0 + (parking * 0.015)
        
        # Market jitter / unobserved micro-location variance (+- 4%)
        jitter = np.random.normal(1.0, 0.038)
        
        sqft_rate = base_rate_sqft * type_mult * furn_mult * age_factor * floor_factor * parking_factor * jitter
        calculated_price = round(area_sqft * sqft_rate, -3) # Round to nearest thousand
        
        rows.append({
            "city": city,
            "locality": locality,
            "state": state,
            "area_sqft": area_sqft,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "floors": floors,
            "parking": parking,
            "property_age": property_age,
            "furnishing_status": furnishing,
            "property_type": prop_type,
            "price": calculated_price
        })
        
    df = pd.DataFrame(rows)
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "house_prices.csv")
    
    df = generate_dataset(4500)
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} records to {out_path}")
    print(df.head())
    print("\nPrice summary (in INR):")
    print(df["price"].describe())


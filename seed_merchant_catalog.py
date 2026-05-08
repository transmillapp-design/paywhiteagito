#!/usr/bin/env python3
"""
Script para popular o catálogo da Loja Demo com produtos de teste
"""
import os
import uuid
from pymongo import MongoClient
from datetime import datetime

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(mongo_url)
db = client['agitocoin']

# ID do lojista demo
MERCHANT_ID = "lojista-demo-001"

print("🏪 Populando catálogo da Loja Demo...")

# Limpar produtos existentes
db.products.delete_many({"merchant_id": MERCHANT_ID})
db.product_categories.delete_many({"merchant_id": MERCHANT_ID})

# Criar categorias
categories = [
    {
        "category_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "name": "Pizzas Salgadas",
        "display_order": 1,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "category_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "name": "Pizzas Doces",
        "display_order": 2,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "category_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "name": "Bebidas",
        "display_order": 3,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "category_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "name": "Sobremesas",
        "display_order": 4,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
]

db.product_categories.insert_many(categories)
print(f"✅ {len(categories)} categorias criadas")

# Função para criar variações únicas para cada produto
def create_size_variations():
    """Cria um novo set de variações de tamanho com IDs únicos"""
    return [
        {
            "variation_id": str(uuid.uuid4()),
            "name": "Pequena",
            "description": "4 fatias",
            "price_adjustment": -8.0
        },
        {
            "variation_id": str(uuid.uuid4()),
            "name": "Média",
            "description": "6 fatias",
            "price_adjustment": 0.0
        },
        {
            "variation_id": str(uuid.uuid4()),
            "name": "Grande",
            "description": "8 fatias",
            "price_adjustment": 12.0
        }
    ]

# Função para criar complementos únicos para cada produto
def create_complements():
    """Cria um novo set de complementos com IDs únicos"""
    return [
        {
            "complement_id": str(uuid.uuid4()),
            "name": "Borda Catupiry",
            "description": "Borda recheada com catupiry",
            "price": 8.0
        },
        {
            "complement_id": str(uuid.uuid4()),
            "name": "Borda Cheddar",
            "description": "Borda recheada com cheddar",
            "price": 8.0
        },
        {
            "complement_id": str(uuid.uuid4()),
            "name": "Extra Queijo",
            "description": "Queijo adicional",
            "price": 5.0
        }
    ]

# Criar produtos
products = [
    # Pizzas Salgadas
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[0]["category_id"],
        "name": "Pizza Margherita",
        "description": "Molho de tomate, mussarela, tomate fresco e manjericão",
        "price": 42.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1574071318508-1cdbab80d002"],
        "variations": create_size_variations(),
        "complements": create_complements(),
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[0]["category_id"],
        "name": "Pizza Calabresa",
        "description": "Molho de tomate, mussarela, calabresa fatiada e cebola",
        "price": 45.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"],
        "variations": create_size_variations(),
        "complements": create_complements(),
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[0]["category_id"],
        "name": "Pizza Portuguesa",
        "description": "Molho de tomate, mussarela, presunto, ovos, cebola e azeitonas",
        "price": 48.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1513104890138-7c749659a591"],
        "variations": create_size_variations(),
        "complements": create_complements(),
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[0]["category_id"],
        "name": "Pizza Quatro Queijos",
        "description": "Molho de tomate, mussarela, parmesão, provolone e catupiry",
        "price": 50.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f"],
        "variations": create_size_variations(),
        "complements": create_complements(),
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[0]["category_id"],
        "name": "Pizza Frango com Catupiry",
        "description": "Molho de tomate, frango desfiado e catupiry",
        "price": 46.0,
        "is_available": True,
        "has_promotion": True,
        "promotion_price": 39.90,
        "images": ["https://images.unsplash.com/photo-1628840042765-356cda07504e"],
        "variations": create_size_variations(),
        "complements": create_complements(),
        "created_at": datetime.utcnow()
    },
    
    # Pizzas Doces
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[1]["category_id"],
        "name": "Pizza de Chocolate",
        "description": "Chocolate ao leite derretido",
        "price": 38.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1593560708920-61dd98c46a4e"],
        "variations": create_size_variations(),
        "complements": [],
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[1]["category_id"],
        "name": "Pizza de Morango",
        "description": "Chocolate branco e morangos frescos",
        "price": 42.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"],
        "variations": create_size_variations(),
        "complements": [],
        "created_at": datetime.utcnow()
    },
    
    # Bebidas
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[2]["category_id"],
        "name": "Coca-Cola 2L",
        "description": "Refrigerante Coca-Cola 2 litros",
        "price": 12.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1554866585-cd94860890b7"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[2]["category_id"],
        "name": "Guaraná Antarctica 2L",
        "description": "Refrigerante Guaraná Antarctica 2 litros",
        "price": 10.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1624517452488-04869289c4ca"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[2]["category_id"],
        "name": "Suco de Laranja Natural 500ml",
        "description": "Suco natural de laranja",
        "price": 8.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1600271886742-f049cd451bba"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    },
    
    # Sobremesas
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[3]["category_id"],
        "name": "Pudim de Leite",
        "description": "Pudim caseiro de leite condensado",
        "price": 15.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1587314168485-3236d6710814"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[3]["category_id"],
        "name": "Brownie de Chocolate",
        "description": "Brownie artesanal com chocolate belga",
        "price": 12.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1606313564200-e75d5e30476c"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    },
    {
        "product_id": str(uuid.uuid4()),
        "merchant_id": MERCHANT_ID,
        "category_id": categories[3]["category_id"],
        "name": "Sorvete 2 Bolas",
        "description": "2 bolas de sorvete sabor a sua escolha",
        "price": 10.0,
        "is_available": True,
        "is_active": True,
        "has_promotion": False,
        "images": ["https://images.unsplash.com/photo-1563805042-7684c019e1cb"],
        "variations": [],
        "complements": [],
        "created_at": datetime.utcnow()
    }
]

db.products.insert_many(products)
print(f"✅ {len(products)} produtos criados")

# Verificar
total_produtos = db.products.count_documents({"merchant_id": MERCHANT_ID})
total_categorias = db.product_categories.count_documents({"merchant_id": MERCHANT_ID})

print("\n📊 Resumo:")
print(f"  - Lojista: {MERCHANT_ID}")
print(f"  - Categorias: {total_categorias}")
print(f"  - Produtos: {total_produtos}")
print("\n✅ Catálogo populado com sucesso!")
print(f"\n🔗 Teste em: /catalog/{MERCHANT_ID}")

import google.generativeai as genai

TOOL_DEFINITIONS = genai.protos.Tool(
    function_declarations=[
        genai.protos.FunctionDeclaration(
            name="get_stock",
            description="Bir ürünün mevcut stok miktarını, birimini ve son güncelleme zamanını getirir.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "product_name": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="Ürünün adı (örn: domates, biber, elma)",
                    )
                },
                required=["product_name"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="check_threshold",
            description="Bir ürünün kritik stok eşiğini kontrol eder.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "product_name": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="Kontrol edilecek ürünün adı",
                    )
                },
                required=["product_name"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="get_daily_orders",
            description="Belirli bir tarihteki siparişleri listeler.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "date": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="YYYY-MM-DD formatında tarih",
                    )
                },
                required=["date"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="assign_task",
            description="Belirtilen role yeni bir görev atar.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "role": genai.protos.Schema(type=genai.protos.Type.STRING, description="warehouse, manager, producer, customer_rep"),
                    "title": genai.protos.Schema(type=genai.protos.Type.STRING, description="Görevin başlığı"),
                    "description": genai.protos.Schema(type=genai.protos.Type.STRING, description="Görevin detayı"),
                    "priority": genai.protos.Schema(type=genai.protos.Type.STRING, description="high, medium, low"),
                    "product_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="İlgili ürün adı"),
                },
                required=["role", "title", "priority"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="update_stock",
            description="Bir ürünün stok miktarını günceller.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "product_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Güncellenecek ürünün adı"),
                    "delta": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Miktar değişimi. Pozitif = giriş, negatif = çıkış"),
                    "reason": genai.protos.Schema(type=genai.protos.Type.STRING, description="harvest, sale, correction, waste"),
                },
                required=["product_name", "delta", "reason"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="get_sales_forecast",
            description="Geçmiş siparişlere bakarak tahmini talep hesaplar.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "product_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Tahmin yapılacak ürünün adı"),
                    "days": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Kaç günlük tahmin"),
                },
                required=["product_name", "days"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="send_notification",
            description="Bir kullanıcıya veya role bildirim gönderir.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "role": genai.protos.Schema(type=genai.protos.Type.STRING, description="warehouse, manager, producer, customer_rep"),
                    "title": genai.protos.Schema(type=genai.protos.Type.STRING, description="Bildirim başlığı"),
                    "message": genai.protos.Schema(type=genai.protos.Type.STRING, description="Bildirim mesajı"),
                    "type": genai.protos.Schema(type=genai.protos.Type.STRING, description="info, warning, error"),
                },
                required=["role", "title", "message"],
            ),
        ),
    ]
)

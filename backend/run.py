from app import create_app, db

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        # Creates all tables from models if they don't already exist
        db.create_all()
    app.run(debug=True, port=5000)

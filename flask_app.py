# flaskapp.py - Add these routes
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# Serve service worker from root
@app.route("/sw.js")
def service_worker():
    response = send_from_directory("static", "sw.js", mimetype="application/javascript")
    
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    return response

# Serve manifest
@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json")

# Add offline route if you want a custom offline page
@app.route("/offline")
def offline():
    return render_template("offline.html") 
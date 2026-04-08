from flask import Flask, render_template, request, send_file, jsonify, session, redirect, url_for
import os
import rawpy
import imageio
from PIL import Image
import zipfile
import io
import yt_dlp
import uuid

app = Flask(__name__)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
OUTPUT_FOLDER = os.path.join(os.getcwd(), 'outputs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# --- AUTHENTICATION ---
app.secret_key = 'omniconvert_premium_secret_key'

@app.before_request
def require_login():
    # Dejamos pasar peticiones a la ruta de login, archivos estáticos (CSS/JS) o si es preflight OPTIONS.
    if request.path == '/login' or request.path.startswith('/static/'):
        return
    if request.method == 'OPTIONS':
        return
    # Si no tiene iniciada su sesión, lo mandamos al login.
    if not session.get('logged_in'):
        return redirect(url_for('login', next=request.path))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = False
    if request.method == 'POST':
        # Validamos tu nueva contraseña única
        if request.form.get('password') == 'omniconvertbyfer':
            session['logged_in'] = True
            return redirect(request.args.get('next') or url_for('index'))
        else:
            error = True
            
    # Pantalla HTML moderna y glassmorfica
    html = '''
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Acceso - OMniConvert Pro</title>
        <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
            .login-box { background: rgba(255,255,255,0.05); padding: 50px 40px; border-radius: 20px; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.2); border-left: 1px solid rgba(255,255,255,0.2);}
            input[type="password"] { padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 20px; width: 90%; background: rgba(0,0,0,0.3); color: white; font-size: 16px; outline: none; transition: 0.3s;}
            input[type="password"]:focus { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
            button { background: #3b82f6; color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 16px; transition: 0.3s;}
            button:hover { background: #2563eb; transform: translateY(-2px);}
        </style>
    </head>
    <body>
        <div class="login-box">
            <h2 style="margin-top:0; font-size: 28px;">OMniConvert Pro</h2>
            <p style="color: #94a3b8; margin-bottom: 25px;">Introduce la contraseña para acceder</p>
            '''
    if error:
        html += '<p style="color: #ef4444; margin-top: -15px; margin-bottom: 20px;">Contraseña incorrecta, intenta de nuevo.</p>'
        
    html += '''
            <form method="post">
              <input type="password" name="password" placeholder="Contraseña..." required autofocus>
              <br>
              <button type="submit">Desbloquear Suite</button>
            </form>
        </div>
    </body>
    </html>
    '''
    return html
# ----------------------


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/convert/nef', methods=['POST'])
def convert_nef():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    job_id = str(uuid.uuid4())
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{file.filename}")
    file.save(input_path)

    try:
        if file.filename.lower().endswith('.zip'):
            # Handle ZIP archive
            with zipfile.ZipFile(input_path, 'r') as zf:
                nef_files = [f for f in zf.namelist() if f.lower().endswith('.nef')]
                if not nef_files:
                    return jsonify({'error': 'No NEF files found in ZIP'})
                
                output_zip_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}_converted.zip")
                with zipfile.ZipFile(output_zip_path, 'w') as out_zf:
                    for filename in nef_files:
                        with zf.open(filename) as f_in:
                            raw_data = f_in.read()
                            with rawpy.imread(io.BytesIO(raw_data)) as raw:
                                rgb = raw.postprocess()
                                img = Image.fromarray(rgb)
                                img_io = io.BytesIO()
                                img.save(img_io, 'JPEG', quality=95)
                                name_only = os.path.splitext(os.path.basename(filename))[0]
                                out_zf.writestr(f"{name_only}.jpg", img_io.getvalue())
            return send_file(output_zip_path, as_attachment=True, download_name='converted_images.zip')

        elif file.filename.lower().endswith('.nef'):
            # Handle single NEF
            with rawpy.imread(input_path) as raw:
                rgb = raw.postprocess()
                img = Image.fromarray(rgb)
                output_jpg = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}.jpg")
                img.save(output_jpg, 'JPEG', quality=95)
            return send_file(output_jpg, as_attachment=True, download_name=f"{os.path.splitext(file.filename)[0]}.jpg")
        else:
            return jsonify({'error': 'Unsupported file format'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/convert/youtube', methods=['POST'])
def convert_youtube():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp4') # 'mp4' or 'mp3'
    quality = data.get('quality', 'high') # 'high' or 'low'

    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    job_id = str(uuid.uuid4())
    ydl_opts = {
        'outtmpl': os.path.join(app.config['OUTPUT_FOLDER'], f'{job_id}_%(title)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }

    if format_type == 'mp3':
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320' if quality == 'high' else '128',
        }]
    else:
        # MP4
        if quality == 'high':
            ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        else:
            # 720p maximum for low quality
            ydl_opts['format'] = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Find the downloaded file
            title = info.get('title', 'video')
            ext = 'mp3' if format_type == 'mp3' else 'mp4'
            # Some postprocessors change the extension, so we get the final filename dynamically
            expected_filename = ydl.prepare_filename(info)
            if format_type == 'mp3':
                expected_filename = os.path.splitext(expected_filename)[0] + '.mp3'
            
            return send_file(expected_filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/convert/apk', methods=['POST'])
def convert_apk():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Simple demonstration of returning a mocked response or instructions
    # since building a full APK requires Android Node/Gradle SDKs installed.
    # In a full setup, this would trigger: `bubblewrap build` or `buildozer android debug`.
    app.logger.info(f"Requested APK build for {url}")
    
    # We will simulate the building requirement and return a setup script
    return jsonify({
        'status': 'queued', 
        'message': f'La petición para compilar {url} ha sido recibida. El servidor necesita configurar Android SDK para generar el APK final.'
    })

@app.route('/api/convert/pdf', methods=['POST'])
def convert_pdf():
    from pdf2docx import Converter
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    job_id = str(uuid.uuid4())
    input_pdf = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{file.filename}")
    file.save(input_pdf)
    
    output_docx = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}_converted.docx")
    
    try:
        cv = Converter(input_pdf)
        cv.convert(output_docx, start=0, end=None)
        cv.close()
        
        dl_name = os.path.splitext(file.filename)[0] + '.docx'
        return send_file(output_docx, as_attachment=True, download_name=dl_name)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

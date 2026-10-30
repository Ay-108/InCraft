InCraft --- The Art of Intelligent Inventory

A smart inventory management system designed to help businesses manage
products, sales, stock levels, reports, and analytics from a
centralized platform.

📌 Project Overview

InCraft is a minor project focused on intelligent inventory
management. The system combines inventory operations with sales
tracking, analytics, reporting, and activity monitoring to provide a
more organized approach to managing business stock.

Unlike a basic CRUD application, InCraft is designed around a complete
inventory workflow:

Product Management → Inventory Tracking → Sales → Stock Updates →
Analytics → Reports

The project is developed using Python, Flask, MySQL, HTML, CSS, and
JavaScript, with Pandas and Matplotlib used for data
processing and visualization.

🎯 Objectives

Manage products and inventory efficiently.

Track stock quantities and product information.

Record and manage sales transactions.

Automatically update inventory after sales.

Import inventory/sales data from files.

Export data for external use and reporting.

Provide dashboard-based business insights.

Analyze sales and inventory trends.

Maintain an activity/history record.

Provide a clean and user-friendly management interface.

✨ Key Features

📊 Dashboard

Overview of inventory and sales information.

Key business statistics.

Quick access to major modules.

Data-driven summaries for faster decision-making.

📦 Inventory Management

Add new products.

Edit existing products.

Archive products.

Search products and records.

Track available stock.

Import inventory data.

Export inventory data.

💰 Sales Management

Create sales transactions.

Select products and enter quantities.

Calculate total sales values.

Store sales records in MySQL.

Automatically reduce inventory stock after a successful sale.

View sales history.

📈 Analytics

Revenue analysis.

Sales statistics.

Inventory statistics.

Sales trend analysis.

Data-driven charts and visualizations.

Analysis of imported sales data.

📁 Import & Export

Upload/import structured data.

Process imported inventory or sales records.

Analyze imported sales dates and related information.

Export data for reporting or further processing.

📝 Activity History

Track important system activities.

Maintain a record of inventory and sales operations.

⚙️ Settings

Manage user-related settings.

Support account/profile configuration.

Password-related settings.

🔎 Search

Search products and records quickly.

Reduce the time required to locate inventory or sales information.

🛠️ Technology Stack

Technology       Purpose

HTML5        Web page structure
CSS3         User interface and styling
JavaScript   Frontend interaction and dynamic functionality
Python       Backend programming
Flask        Web application framework
MySQL        Relational database
Pandas       Data processing and analysis
Matplotlib   Data visualization
Jinja2       Server-side HTML templating

🏗️ Project Architecture

InCraft/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── routes.py
│   └── utils.py
│
├── database/
│   └── schema.sql
│
├── templates/
│   ├── components/
│   │   ├── navbar.html
│   │   ├── sidebar.html
│   │   └── footer.html
│   │
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── inventory.html
│   ├── product_form.html
│   ├── sales.html
│   ├── analytics.html
│   ├── activity.html
│   └── settings.html
│
├── public/
│   └── static/
│       ├── css/
│       ├── images/
│       └── js/
│
├── pyproject.toml
├── vercel.json
├── render.yaml
├── requirements.txt
├── requirements-dev.txt
├── .python-version
└── README.md

🔄 System Workflow

User
  │
  ▼
Login / Registration
  │
  ▼
Dashboard
  │
  ├──────────────► Inventory Management
  │                       │
  │                       ▼
  │                 Product / Stock Data
  │
  ├──────────────► Sales Management
  │                       │
  │                       ▼
  │                 Sales Transaction
  │                       │
  │                       ▼
  │                 Stock Adjustment
  │
  ├──────────────► Import / Export
  │                       │
  │                       ▼
  │                 Data Processing
  │
  └──────────────► Analytics & Reports
                          │
                          ▼
                    Business Insights

🗄️ Database

InCraft uses MySQL as its relational database management system.

The database is responsible for storing and managing information such
as:

User information

Product information

Inventory quantities

Sales transactions

Sales dates

Activity/history records

Other application-related data

The database schema is maintained in:

database/schema.sql

📥 Data Import and Analysis

One of InCraft's extended features is data import.

Users can upload structured data, such as inventory or sales records,
which can then be processed by the application.

For sales data, the system can use imported records to support analysis
based on information such as:

Product

Quantity

Sales amount

Sales date

Transaction information

This allows historical sales data to be transformed into useful
analytical information rather than simply storing it as raw records.

📊 Analytics and Visualization

The analytics module is designed to convert inventory and sales data
into meaningful information.

Potential analytical outputs include:

Total revenue

Total sales

Sales trends

Product performance

Inventory statistics

Stock-related insights

Date-based sales analysis

Pandas can be used for data processing and aggregation, while
Matplotlib can be used to generate visualizations.

🔐 Security Considerations

Sensitive information should not be committed to a public repository.

For example:

.env
database passwords
API keys
secret keys
virtual environments
private uploaded files

Use environment variables for sensitive configuration wherever possible.

Example:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=incraft

Do not replace your_password with a real password in a public
repository.

🚀 Installation and Setup

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/InCraft.git
cd InCraft

2. Create a virtual environment

Windows:

python -m venv venv

Activate it:

venv\Scripts\activate

3. Install dependencies

pip install -r requirements.txt

4. Configure MySQL

Create the required MySQL database and execute:

database/schema.sql

Then configure the application's database connection using environment
variables or the project's configuration system.

5. Run the Flask application

Depending on the application's entry point:

python backend/app.py

The application can then normally be accessed through:

http://127.0.0.1:5000

🧪 Development Status

InCraft is being developed as a minor academic project.

The project focuses on demonstrating the practical integration of:

Web development

Backend programming

Relational database management

Inventory management

Sales management

Data analysis

Data visualization

Import/export workflows

🔮 Future Scope

Possible future improvements include:

Role-based access control.

Barcode/QR-code support.

Automated low-stock notifications.

Advanced sales forecasting.

Machine-learning-based demand prediction.

Supplier management.

Purchase order management.

Cloud deployment.

REST API integration.

PDF report generation.

Automated scheduled reports.

More advanced business intelligence dashboards.

👨‍💻 Project Information

Project: InCraft --- The Art of Intelligent Inventory

Project Type: Minor Project

Domain: Inventory Management / Business Management

Backend: Python + Flask

Database: MySQL

Frontend: HTML + CSS + JavaScript

Data Analysis: Pandas

Visualization: Matplotlib

## Deployment

### Recommended: deploy the existing full-stack Flask app to Vercel

InCraft currently uses Flask and Jinja templates for both its pages and its backend routes. It is therefore a **single full-stack Flask application**, not a separate React/Vue frontend and REST API. The deployment setup keeps that architecture intact:

- `pyproject.toml` explicitly points Vercel to the Flask application object at `backend.app:app`.
- `templates/` remains the server-rendered frontend.
- `public/static/` contains the CSS, JavaScript, and image assets served directly by Vercel's CDN. Flask also keeps its `static` endpoint registered so Jinja's `url_for('static', ...)` calls can resolve during template rendering.
- Flask continues to provide the application's pages and API routes.
- MySQL must be hosted separately and reachable over the network.

**Vercel setup**

1. Import `Ay-108/InCraft` as a new project in Vercel and keep the project root at the repository root.
2. Let Vercel detect Flask. Do not set a separate frontend build command or output directory.
3. Add the environment variables below to the Vercel project (Production, Preview, and Development as appropriate).
4. Deploy. After deployment, open `/api/health`; it returns HTTP 200 only when InCraft can connect to MySQL.

The `/api/health` endpoint reports missing environment-variable **names** (never their values) when production configuration is incomplete. Unexpected import-time exceptions are visible in Vercel Runtime Logs. The public health endpoint reports missing configuration and database availability without exposing secret values.
5. Use `vercel dev` locally to test the same Vercel entry point before production deployment.

| Variable | Required value |
|---|---|
| `INCRAFT_SECRET_KEY` | A long, random secret; never commit it (Flask's `SECRET_KEY` is also accepted as an alias) |
| `INCRAFT_DEBUG` | `false` |
| `INCRAFT_SESSION_COOKIE_SECURE` | `true` |
| `DB_HOST` | Hostname of the managed MySQL server |
| `DB_PORT` | MySQL port, usually `3306` |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |

Do not use `localhost` for `DB_HOST` in Vercel: it refers to the function instance, not your computer. Create the database with a managed MySQL provider that permits connections from your deployment environment, and apply `database/schema.sql` to it before opening the app.

**Important storage limitation:** Vercel Functions have a read-only application filesystem. InCraft now writes temporary upload and export files under `/tmp/incraft` on Vercel, but that storage is temporary and is not a durable file store. Database records belong in MySQL. Before relying on long-term retention of uploaded documents or generated files, connect an object-storage service (for example, S3-compatible storage) and store its object keys in MySQL. Do not treat `/tmp` as permanent storage.

Vercel also caps function request and response bodies at 4.5 MB. InCraft sets its default upload limit to 4 MB on Vercel (the existing 16 MB default remains on local and conventional hosts). For larger imports or exports, upload/download directly from object storage rather than proxying the file through a Flask function.

**Dependencies:** Vercel installs Python packages from the `dependencies` array in `pyproject.toml`, so that file explicitly declares Flask, Flask-WTF, MySQL Connector/Python, openpyxl, and scikit-learn. `requirements.txt` mirrors the runtime packages for local and conventional-host deployment. The previous broad development/workspace package list is preserved in `requirements-dev.txt`.

### Alternative: Render for a persistent application server

The repository also includes `render.yaml` for a conventional Gunicorn deployment. Render is a better fit when you prefer a long-running web service. The blueprint uses the same external MySQL configuration and defaults to Render's free plan for preview/testing; free services can spin down when idle and cannot attach persistent disks. For durable local file storage, upgrade the service to a paid plan, attach a disk (for example at `/var/data`), and set `INCRAFT_UPLOAD_DIR=/var/data/uploads` and `INCRAFT_EXPORT_DIR=/var/data/exports`. Object storage remains the better option when you need to scale beyond a single service instance.

### Local production-style check

```bash
pip install -r requirements.txt
INCRAFT_ENV=production INCRAFT_DEBUG=false INCRAFT_SECRET_KEY="replace-with-a-random-secret" python -c "from backend.app import app; print(app.url_map)"
```

On Windows PowerShell, set those environment variables with `$env:NAME = "value"` before running the Python command.

📄 License

This project is developed for academic and educational purposes.

If you intend to reuse or distribute the project, add an appropriate
open-source license and update this section accordingly.

🙏 Acknowledgement

InCraft was developed as an academic project to explore the practical
application of web development, database management, inventory systems,
sales analysis, and data visualization in a single integrated
application.

InCraft --- The Art of Intelligent Inventory

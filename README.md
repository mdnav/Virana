🌿 Virana
The Digital Home for India's Living Heritage
Discover • Connect • Document • Preserve

<p align="center"> <strong>Explore India's culture. Preserve its stories. Connect generations.</strong> </p>
<p align="center">
  🌐 <strong><a href="https://virana.vercel.app/">Live Demo</a></strong>
</p>
Explore the live application and experience Virana's cultural discovery platform.
<br>
🌏 About
Virana is an AI-powered, community-driven platform for discovering, documenting, connecting, and preserving India's living cultural heritage.

It brings together:

🗣️ Languages & dialects

🎉 Festivals & celebrations

🛕 Rituals & traditions

🎵 Music & folk songs

💃 Dance & performing arts

🎨 Arts & crafts

🍛 Food & spices

📖 Folk stories & oral histories

🏛️ Heritage sites & monuments

🏘️ Local and community traditions

Virana combines Cultural Discovery + Community Documentation + AI Assistance + Digital Preservation into one connected cultural ecosystem.

Core Flow
DISCOVER → DOCUMENT → VERIFY → PRESERVE → CONNECT

🎯 Problem
India's cultural knowledge is often fragmented across platforms, languages, communities, and generations.

Key challenges include:

Limited digital representation of local traditions

Undocumented oral histories and community knowledge

Regional-language accessibility barriers

Difficult discovery of lesser-known heritage

Cultural records lacking relationships and context

Need for reliable sources, verification, and attribution

💡 Core Pillars
🔎 Discover
Explore cultural heritage through maps, search, structured records, AI, and cultural events.

📝 Document
Contribute stories, traditions, languages, audio, images, videos, documents, and local knowledge.

🛡️ Preserve
Use structured data, multilingual processing, verification, AI-assisted organization, and digital storage to preserve cultural knowledge.

✨ Features
🗺️ Interactive Cultural Map
Explore India's cultural landscape by:

India → State → District → City/Town/Village → Cultural Location → Heritage Record

Supports:

State/district exploration

Location-based discovery

Category filtering

Nearby heritage

Marker clustering

Festival discovery

Heritage-at-risk visualization

Categories include heritage sites, dance, music, arts & crafts, food, spices, festivals, rituals, languages, folk stories, and performing arts.

🔎 Heritage Explorer
Structured cultural records containing:

Name, description & history

Cultural significance

Location & historical period

Architecture & traditions

Festivals & languages

Images, videos, audio & documents

Sources & verification status

Preservation status

Related heritage

The goal is a connected cultural knowledge layer, not isolated information pages.

📸 HeritageLens
AI-powered visual heritage recognition for temples, monuments, forts, palaces, statues, artifacts, artwork, and heritage locations.

Image
 ↓
Visual Analysis
 ↓
Feature Extraction
 ↓
Heritage Recognition
 ↓
Knowledge-Base Matching
 ↓
Confidence Evaluation
 ↓
Possible Matches + Cultural Information

Results may include heritage name, location, history, period, architecture, significance, related heritage, sources, and confidence.

Trust principle: uncertain recognition is never presented as absolute truth.

High Confidence   → Likely Match
Medium Confidence → Possible Matches
Low Confidence    → Insufficient Evidence

🤖 Virana AI
AI cultural assistant supporting:

Natural-language questions

Semantic search

RAG-based knowledge retrieval

Summarization

Translation

Language detection

Contextual explanations

Location-aware discovery

Heritage recommendations

Question → Query Understanding → Semantic Search → Retrieval
→ Context Evaluation → AI Response → Source-Aware Answer

AI distinguishes between:

Verified information

Community information

Unverified information

AI-generated summaries

🌐 Multilingual Heritage
Supports:

Language detection

Translation

Multilingual search

Local-language contributions

Speech-to-text

AI summarization

Original-language preservation

Original cultural expression remains part of the record.

🎙️ Voices of Heritage
Preserves:

Local dialects

Folk songs

Oral histories

Elder stories

Traditional narratives

Community memories

Audio → Language Detection → Speech-to-Text → Transcript
→ Translation → Summary → Metadata → Digital Preservation

Original audio and language remain preserved.

🤝 Community Contributions
Users can contribute stories, festivals, traditions, rituals, food, music, dance, languages, dialects, arts, images, audio, videos, documents, and lesser-known heritage.

Contribution
 → Metadata & Location
 → Language Processing
 → Translation/Summary
 → Duplicate Detection
 → Moderation
 → Human Verification
 → Cultural Database
 → Search / Map / AI / Explorer

Community contributions are not automatically treated as verified facts.

🧠 Intelligent Duplicate Detection
Uses:

Text similarity

Semantic similarity

Location

Cultural context

Existing records

Related media

Similar traditions may represent meaningful regional variations and should not automatically be treated as duplicates.

💬 Community Discussions
Users can:

Comment and reply

Suggest corrections

Share regional variations

Add cultural context

Report information

🛡️ Moderation & Verification
AI assists with:

Spam detection

Duplicate detection

Language processing

Content moderation

Summarization

Potential misinformation

Human reviewers handle:

Cultural corrections

Historical accuracy

Regional variations

Verification decisions

Community disputes

Typical lifecycle:

DRAFT → PROCESSING → PENDING_REVIEW → APPROVED
                                  ↘ REJECTED / FLAGGED

⚠️ Heritage at Risk
Tracks preservation needs for declining languages, crafts, folk music, oral traditions, dance, local practices, and traditional art.

Possible states:

ACTIVE
DECLINING
AT_RISK
REQUIRES_SAFEGUARDING
REVIVING
NEEDS_ASSESSMENT

Classifications should be evidence-based and verified, not generated solely by AI.

📅 Cultural Calendar
Discover:

Upcoming festivals

Regional celebrations

Traditional events

Cultural occasions

Performing arts events

Festival → Date → Region → Cultural Locations → Map

👤 Personal Heritage Profile
Registered users can manage:

Saved heritage

Saved locations

Collections

Contributions

Comments

Recently explored heritage

Saved festivals

Language preferences

Recommendations

📊 Cultural Analytics
Aggregated insights may include:

Most explored heritage

Popular categories

Popular regions

Trending festivals

Popular locations

Contribution activity

Cultural discovery trends

Analytics focus on aggregated information rather than exposing individual activity.

🔐 Authentication & Roles
Authentication includes:

Email/password registration

Email verification

Secure password hashing

JWT authentication

Access & refresh tokens

Password reset

Logout & session management

Role-based access control

Roles:

Guest → Registered User → Contributor → Cultural Expert → Moderator → Admin

🏗️ Architecture
Users
  ↓
React + TypeScript Frontend
  ↓
Cultural Map / Explorer / AI / Community
  ↓
Java + Spring Boot Backend
  ↓
PostgreSQL + PostGIS + pgvector + Redis
  ↓
AI Services
(Vision / RAG / NLP / STT / Translation / Moderation)
  ↓
Cultural Data Sources
(Government / UNESCO / Research / Community)

🤖 AI Architecture
                    AI Gateway
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    Virana AI      HeritageLens    Language AI
     RAG/LLM       Computer Vision  STT/Translation
        └───────────────┼───────────────┘
                        ↓
             Cultural Knowledge Base
                  + Vector Search

🔄 Cultural Data Pipeline
External Source
 ↓
Connector
 ↓
Validation
 ↓
Normalization
 ↓
Duplicate Detection
 ↓
Source Attribution
 ↓
Cultural Database
 ↓
AI Enrichment
 ↓
Search / Map / Explorer / AI

Potential sources include UNESCO, government resources, state cultural departments, Wikidata, Wikimedia, OpenStreetMap, academic research, and community contributions.

Source attribution, licensing, reliability, and verification status should be retained.

🛠️ Technology Stack
Frontend
Technology	Purpose
React	UI
TypeScript	Type-safe development
Vite	Tooling
Tailwind CSS	Styling
shadcn/ui	UI components
React Router	Routing
TanStack Query	Server state
Zustand	Client state
Framer Motion	Animations
MapLibre / Leaflet	Maps
i18next	Internationalization

Backend
Technology	Purpose
Java	Core backend
Spring Boot	Framework
Spring Security	Authentication
Spring Data JPA	Data access
Hibernate	ORM
JWT	Authentication
REST	API architecture
OpenAPI / Swagger	API documentation

AI / ML
Technology	Purpose
Python	AI services
FastAPI	AI APIs
LLMs	Natural-language intelligence
RAG	Grounded answers
Embeddings	Semantic representation
Vector Search	Knowledge retrieval
Computer Vision	HeritageLens
Speech-to-Text	Oral heritage
Translation	Multilingual content
NLP	Language processing

Data & Infrastructure
PostgreSQL

PostGIS

pgvector

Redis

S3-compatible storage

Docker / Docker Compose

GitHub Actions

CI/CD

Cloud deployment

Monitoring & logging

🗃️ Data Model
Core entities include:

Users
Roles
Heritage Records
Categories
Locations
States
Districts
Media
Festivals
Events
Languages
Traditions
Contributions
Comments
Reports
Saved Items
User Activity
Data Sources
Record Sources
Record Relationships
Verification Reviews
Image Recognition Requests
Image Recognition Results

Heritage Record
Includes:

ID
Name
Slug
Category
Description
Historical Information
Cultural Significance
State
District
Locality
Latitude / Longitude
Sources
Verification Status
Preservation Status
Created At
Updated At

📍 Geospatial Model
India
 ↓
State
 ↓
District
 ↓
City / Town / Village
 ↓
Cultural Location
 ↓
Heritage Record

Enables location-based discovery, regional filtering, nearby heritage, map search, festival mapping, clustering, and location-aware recommendations.

📁 Repository Structure
Virana/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── assets/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/main/
│   │   ├── java/com/virana/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── heritage/
│   │   │   ├── map/
│   │   │   ├── festival/
│   │   │   ├── contribution/
│   │   │   ├── moderation/
│   │   │   ├── verification/
│   │   │   └── common/
│   │   └── resources/
│   └── pom.xml
│
├── ai-service/
│   ├── app/
│   │   ├── rag/
│   │   ├── vision/
│   │   ├── speech/
│   │   ├── translation/
│   │   ├── moderation/
│   │   ├── embeddings/
│   │   └── common/
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── ai/
│   ├── database/
│   └── product/
│
├── docker-compose.yml
├── README.md
└── LICENSE

🔐 Security & Trust
Security
JWT authentication

Secure password hashing

Email verification

Role-based access control

Protected APIs

Input validation

Rate limiting

Session management

Audit workflows

Trust
Source attribution

Verification workflows

AI-assisted moderation

Human review

Community reporting

Confidence-aware AI results

Original-language preservation

Clear distinction between verified/unverified information

🚀 Getting Started
Prerequisites
Node.js & npm

Java 17+

Maven

Python 3.10+

PostgreSQL

Git

Docker (recommended)

1. Clone
git clone https://github.com/mohammadnaveed1701-source/virana.git
cd virana

2. Frontend
cd frontend
npm install
npm run dev

3. Backend
cd backend
./mvnw spring-boot:run

Windows:

mvnw.cmd spring-boot:run

4. AI Service
cd ai-service

python -m venv venv

Windows:

venv\Scripts\activate

Linux/macOS:

source venv/bin/activate

Install and run:

pip install -r requirements.txt
uvicorn app.main:app --reload

⚙️ Environment Configuration
Configure environment variables for the required services.

Example:

DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
AI_API_KEY=your_ai_api_key
OBJECT_STORAGE_URL=your_storage_url

Never commit secrets.

Do not commit:

.env
API keys
Passwords
Private tokens
Database credentials
Production secrets

Use environment variables or a secure secrets manager.

🐳 Docker
For local infrastructure and service orchestration:

docker compose up -d

Docker configuration will evolve with the platform.

📚 Documentation
Technical documentation lives under /docs:

docs/
├── architecture/
├── api/
├── ai/
├── database/
└── product/

Planned documentation includes architecture, APIs, database schema, AI/RAG pipelines, contribution and verification workflows, deployment, security, and data sources.

🧪 Development Principles
Modular Architecture — Separate frontend, backend, AI, data, and infrastructure.

Source-Aware Knowledge — Preserve source and verification context.

Human-in-the-Loop — AI assists; it does not determine cultural truth.

Regional Diversity — Preserve meaningful regional variations.

Original Preservation — Translations and summaries do not replace original expression.

Scalable by Design — Support growth from curated datasets to a larger cultural ecosystem.

🚀 Roadmap
Status	Feature
🟢 Active	Cultural discovery
🟢 Active	Interactive cultural map
🚧 Development	Heritage Explorer
🚧 Development	Virana AI
🚧 Development	HeritageLens
🚧 Development	Community contributions
🚧 Development	Multilingual heritage
🔬 Experimental	Voices of Heritage
🔬 Experimental	AI-assisted preservation
📋 Planned	Heritage-at-Risk intelligence
📋 Planned	Cultural recommendation engine
📋 Planned	Advanced cultural analytics
📋 Planned	Researcher tools
📋 Planned	Educational experiences
🔮 Future	AR/VR cultural experiences
🔮 Future	Global Indian heritage network

🌱 Long-Term Vision
Virana aims to evolve through:

Phase 1 → Discover
Phase 2 → Document
Phase 3 → Preserve
Phase 4 → Connect
Phase 5 → Cultural Intelligence
Phase 6 → Global Reach

The long-term goal is to connect places, people, languages, traditions, festivals, food, music, dance, arts, history, and communities into a living digital heritage ecosystem.

📊 Impact
Virana aims to support:

🏛️ Cultural Preservation — Digitally preserve traditions, stories, languages, and heritage.

👥 Community Empowerment — Enable communities to document their own knowledge.

🎓 Education — Make cultural knowledge accessible to students and educators.

🔬 Research — Provide structured cultural information for researchers.

🌍 Discovery — Improve discovery of lesser-known heritage.

🗣️ Language Preservation — Support regional languages and dialects.

🎙️ Oral History — Preserve knowledge transmitted across generations.

Future Possibilities
🧠 Cultural knowledge graph

🗣️ Advanced Indian-language support

🎙️ Large-scale oral-history preservation

📸 Advanced visual heritage recognition

🥽 AR/VR cultural experiences

🧭 AI-powered cultural travel discovery

🎓 Cultural learning experiences

🔬 Researcher tools

📊 Cultural analytics

🏛️ Institutional collaboration

🤝 Community preservation programs

🌍 Global Indian heritage network

📊 Project Status
Virana is an evolving product. The repository may contain:

🟢 Implemented
🚧 In Development
🔬 Experimental
📋 Planned
🔮 Future

The roadmap will evolve as the platform develops.

🤝 Contributing
Contributions are welcome in:

💻 Software Engineering

🤖 AI / ML

🗺️ GIS

🗃️ Data Engineering

🎨 UI / UX

📚 Cultural Research

🗣️ Language Preservation

🧪 Testing

📖 Documentation

Contribution Workflow
Fork
 ↓
Create Branch
 ↓
Make Changes
 ↓
Test
 ↓
Commit
 ↓
Push
 ↓
Pull Request

Please keep contributions focused, documented, and aligned with Virana's cultural integrity principles.

👨‍💻 Developer
Mohammad Naveed

Aspiring Java Full Stack Developer

Building with:

Java • Spring Boot • React • AI • Cloud

🔗 Connect
💼 LinkedIn: Mohammad Naveed

🐙 GitHub: mohammadnaveed1701-source

🌐 Portfolio: portfolio1701.vercel.app

📄 License
This project is currently under development.

License and contribution guidelines will be finalized as the project evolves.

🌿 Thank You
India's heritage is not only found in monuments.

It lives in languages, stories, songs, food, festivals, traditions, and communities.

Every generation has a role in keeping it alive.

🌿 Virana — Discover • Connect • Document • Preserve
Built with technology. Inspired by culture. Created for generations.

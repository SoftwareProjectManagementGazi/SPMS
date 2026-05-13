"""
seeder_extended.py — Kapsamlı Genişletilmiş Veri Tohumlaması
=============================================================
Mevcut seeder.py üzerine:
  - 92 ek kullanıcı (toplam 100)
  - 15 yeni proje (çeşitli sektörler)
  - 12 kapsamlı yaşam döngüsü şablonu (tüm yaygın metodolojiler)
  - Zengin görev hiyerarşileri ve gerçekçi audit loglar

Node ID kuralı: ^nd_[A-Za-z0-9_-]{10}$  (nd_ + tam 10 karakter)
"""

import copy
import logging
import random
from datetime import date, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel, Methodology
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.task import TaskModel, TaskPriority
from app.infrastructure.database.models.comment import CommentModel
from app.infrastructure.database.models.notification import NotificationModel, NotificationType
from app.infrastructure.database.models.label import LabelModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel
from app.infrastructure.database.models.milestone import MilestoneModel
from app.infrastructure.database.models.artifact import ArtifactModel
from app.infrastructure.database.models.process_template import ProcessTemplateModel
from app.domain.entities.project import ProjectStatus
from app.infrastructure.security import get_password_hash

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# 92 EK KULLANICI  (mevcut 8 + 92 = 100 toplam)
# ─────────────────────────────────────────────

EXTRA_USERS_DATA = [
    # Proje Yöneticileri (~12)
    {"email": "ahmet.kaya@firma.com",       "full_name": "Ahmet Kaya",           "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=ahmetkaya"},
    {"email": "fatma.sahin@firma.com",      "full_name": "Fatma Şahin",          "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=fatmasahin"},
    {"email": "mustafa.demir@firma.com",    "full_name": "Mustafa Demir",        "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=mustafademir"},
    {"email": "emine.yildiz@firma.com",     "full_name": "Emine Yıldız",         "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=emineyildiz"},
    {"email": "omer.celik@firma.com",       "full_name": "Ömer Çelik",           "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=omercelik"},
    {"email": "hatice.arslan@firma.com",    "full_name": "Hatice Arslan",        "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=haticearslan"},
    {"email": "ibrahim.aydin@firma.com",    "full_name": "İbrahim Aydın",        "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=ibrahimaydin"},
    {"email": "merve.ozturk@firma.com",     "full_name": "Merve Öztürk",         "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=merveozturk"},
    {"email": "huseyin.kurt@firma.com",     "full_name": "Hüseyin Kurt",         "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=huseyinkurt"},
    {"email": "selin.yilmaz@firma.com",     "full_name": "Selin Yılmaz",         "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=selinyilmaz"},
    {"email": "serkan.dogan@firma.com",     "full_name": "Serkan Doğan",         "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=serkandogan"},
    {"email": "busra.koc@firma.com",        "full_name": "Büşra Koç",            "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=busrakoc"},

    # Üyeler (~80)
    {"email": "berk.aktas@firma.com",       "full_name": "Berk Aktaş",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=berkaktas"},
    {"email": "gamze.cetin@firma.com",      "full_name": "Gamze Çetin",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=gamzecetin"},
    {"email": "arda.polat@firma.com",       "full_name": "Arda Polat",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ardapolat"},
    {"email": "sibel.turk@firma.com",       "full_name": "Sibel Türk",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=sibelturk"},
    {"email": "furkan.isik@firma.com",      "full_name": "Furkan Işık",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=furkanisik"},
    {"email": "tuğba.ceylan@firma.com",     "full_name": "Tuğba Ceylan",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=tugbaceylan"},
    {"email": "koray.bayrak@firma.com",     "full_name": "Koray Bayrak",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=koraybayrak"},
    {"email": "ozlem.guven@firma.com",      "full_name": "Özlem Güven",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ozlemguven"},
    {"email": "volkan.kilic@firma.com",     "full_name": "Volkan Kılıç",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=volkankilic"},
    {"email": "esra.sari@firma.com",        "full_name": "Esra Sarı",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=esrasari"},
    {"email": "mert.yildirim@firma.com",    "full_name": "Mert Yıldırım",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=mertyildirim"},
    {"email": "asli.cakir@firma.com",       "full_name": "Aslı Çakır",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=aslicakir"},
    {"email": "tolga.ucar@firma.com",       "full_name": "Tolga Uçar",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=tolgaucar"},
    {"email": "seyma.guler@firma.com",      "full_name": "Şeyma Güler",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=seymaguler"},
    {"email": "onur.erdogan@firma.com",     "full_name": "Onur Erdoğan",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=onurdogan"},
    {"email": "cigdem.ozel@firma.com",      "full_name": "Çiğdem Özel",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=cigdemozel"},
    {"email": "eray.koç@firma.com",         "full_name": "Eray Koç",             "role": "Member", "avatar": "https://i.pravatar.cc/150?u=eraykoc"},
    {"email": "derya.akar@firma.com",       "full_name": "Derya Akar",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=deryaakar"},
    {"email": "sinan.gunes@firma.com",      "full_name": "Sinan Güneş",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=sinangunes"},
    {"email": "ilknur.karaca@firma.com",    "full_name": "İlknur Karaca",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ilknurkaraca"},
    {"email": "caner.ozdemir@firma.com",    "full_name": "Caner Özdemir",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=canerozdemir"},
    {"email": "pinar.tekin@firma.com",      "full_name": "Pınar Tekin",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=pinartekin"},
    {"email": "alper.sen@firma.com",        "full_name": "Alper Şen",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=alpersen"},
    {"email": "melike.tas@firma.com",       "full_name": "Melike Taş",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=meliketas"},
    {"email": "gokhan.cinar@firma.com",     "full_name": "Gökhan Çınar",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=gokhancinar"},
    {"email": "reyhan.bulut@firma.com",     "full_name": "Reyhan Bulut",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=reyhanbulut"},
    {"email": "kerem.savas@firma.com",      "full_name": "Kerem Savaş",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=keremsavas"},
    {"email": "vildan.erdem@firma.com",     "full_name": "Vildan Erdem",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=vildanerdem"},
    {"email": "taner.ozkan@firma.com",      "full_name": "Taner Özkan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=tanerozkan"},
    {"email": "nurcan.yuce@firma.com",      "full_name": "Nurcan Yüce",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=nurcanyuce"},
    {"email": "barıs.demirci@firma.com",    "full_name": "Barış Demirci",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=barisdemirci"},
    {"email": "ulku.kaplan@firma.com",      "full_name": "Ülkü Kaplan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ulkukaplan"},
    {"email": "serhat.tunç@firma.com",      "full_name": "Serhat Tunç",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=serhattunc"},
    {"email": "gulsen.ates@firma.com",      "full_name": "Gülşen Ateş",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=gulsena"},
    {"email": "ozan.kara@firma.com",        "full_name": "Ozan Kara",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ozankara"},
    {"email": "yeliz.ozgur@firma.com",      "full_name": "Yeliz Özgür",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=yelizozgur"},
    {"email": "erdem.topal@firma.com",      "full_name": "Erdem Topal",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=erdemtopal"},
    {"email": "tuğce.akın@firma.com",       "full_name": "Tuğce Akın",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=tugceakin"},
    {"email": "murat.karadag@firma.com",    "full_name": "Murat Karadağ",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=muratkaradag"},
    {"email": "leyla.arslan@firma.com",     "full_name": "Leyla Arslan",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=leylaarslan"},
    {"email": "deniz.toprak@firma.com",     "full_name": "Deniz Toprak",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=deniztoprak"},
    {"email": "cem.dogan@firma.com",        "full_name": "Cem Doğan",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=cemdogan"},
    {"email": "yasemin.tan@firma.com",      "full_name": "Yasemin Tan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=yasemintan"},
    {"email": "emre.ergin@firma.com",       "full_name": "Emre Ergin",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=emreergin"},
    {"email": "sevgi.demir@firma.com",      "full_name": "Sevgi Demir",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=sevgidemir"},
    {"email": "fatih.kurt@firma.com",       "full_name": "Fatih Kurt",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=fatihkurt"},
    {"email": "nisa.yıldırım@firma.com",    "full_name": "Nisa Yıldırım",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=nisayildirim"},
    {"email": "baris.ozkan@firma.com",      "full_name": "Barış Özkan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=barisozkan"},
    {"email": "ipek.celik@firma.com",       "full_name": "İpek Çelik",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ipekcelik"},
    {"email": "yasin.acar@firma.com",       "full_name": "Yasin Acar",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=yasinacar"},
    {"email": "betul.kaya@firma.com",       "full_name": "Betül Kaya",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=betulkaya"},
    {"email": "hasan.şimşek@firma.com",     "full_name": "Hasan Şimşek",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=hasansimsek"},
    {"email": "duygu.polat@firma.com",      "full_name": "Duygu Polat",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=duygupolat"},
    {"email": "ilker.kahraman@firma.com",   "full_name": "İlker Kahraman",       "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ilkerkahraman"},
    {"email": "nilay.gul@firma.com",        "full_name": "Nilay Gül",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=nilaygul"},
    {"email": "ercan.yıldız@firma.com",     "full_name": "Ercan Yıldız",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ercanyildiz"},
    {"email": "ceren.sahin@firma.com",      "full_name": "Ceren Şahin",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=cerensahin"},
    {"email": "ugur.aydin@firma.com",       "full_name": "Uğur Aydın",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=uguraydin"},
    {"email": "meltem.yücel@firma.com",     "full_name": "Meltem Yücel",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=meltemyucel"},
    {"email": "tarik.bozkurt@firma.com",    "full_name": "Tarık Bozkurt",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=tarikbozkurt"},
    {"email": "hacer.çelik@firma.com",      "full_name": "Hacer Çelik",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=hacercelik"},
    {"email": "kaan.erdoğan@firma.com",     "full_name": "Kaan Erdoğan",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=kaanerdogan"},
    {"email": "sedef.karaman@firma.com",    "full_name": "Sedef Karaman",        "role": "Member", "avatar": "https://i.pravatar.cc/150?u=sedefkaraman"},
    {"email": "enes.yıldız@firma.com",      "full_name": "Enes Yıldız",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=enesyildiz"},
    {"email": "suat.turhan@firma.com",      "full_name": "Suat Turhan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=suatturhan"},
    {"email": "mine.ozcan@firma.com",       "full_name": "Mine Özcan",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=mineozcan"},
    {"email": "hakan.bulut@firma.com",      "full_name": "Hakan Bulut",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=hakanbulut"},
    {"email": "lale.demir@firma.com",       "full_name": "Lale Demir",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=laledemir"},
    {"email": "cagri.yılmaz@firma.com",     "full_name": "Çağrı Yılmaz",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=cagriyilmaz"},
    {"email": "sıla.kara@firma.com",        "full_name": "Sıla Kara",            "role": "Member", "avatar": "https://i.pravatar.cc/150?u=silakara"},
    {"email": "nuri.öztürk@firma.com",      "full_name": "Nuri Öztürk",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=nuriozturk"},
    {"email": "ezgi.çetin@firma.com",       "full_name": "Ezgi Çetin",           "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ezgicetin"},
    {"email": "ahmet.aslan@firma.com",      "full_name": "Ahmet Aslan",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ahmetaslan"},
    {"email": "burcu.yılmaz@firma.com",     "full_name": "Burcu Yılmaz",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=burcuyilmaz"},
    {"email": "murat.koçak@firma.com",      "full_name": "Murat Koçak",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=muratkocak"},
    {"email": "selma.arslan@firma.com",     "full_name": "Selma Arslan",         "role": "Member", "avatar": "https://i.pravatar.cc/150?u=selmaarslan"},
    {"email": "zafer.güneş@firma.com",      "full_name": "Zafer Güneş",          "role": "Member", "avatar": "https://i.pravatar.cc/150?u=zafergunes"},
]

# ─────────────────────────────────────────────
# 15 EK PROJE  (çeşitli sektörler & metodolojiler)
# ─────────────────────────────────────────────

EXTRA_PROJECTS_DATA = [
    {
        "name": "Fintech Ödeme Altyapısı",
        "key": "FIN",
        "description": "Bankacılık API entegrasyonu, 3D Secure ödeme akışları ve anlık para transferi modüllerinin geliştirilmesi. PCI-DSS uyumluluğu zorunludur.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "ahmet.kaya@firma.com",
        "labels": ["Payment", "Security", "API", "PCI-DSS", "Backend"],
        "template_name": "Scrum",
    },
    {
        "name": "E-Devlet Entegrasyon Portalı",
        "key": "EGOV",
        "description": "Devlet kurumları ile veri alışverişi için REST ve SOAP servis entegrasyonları. Resmi dokümantasyon ve onay süreçleri zorunludur.",
        "methodology": Methodology.WATERFALL,
        "status": "ACTIVE",
        "manager_email": "fatma.sahin@firma.com",
        "labels": ["Integration", "SOAP", "REST", "Government", "Compliance"],
        "template_name": "Waterfall",
    },
    {
        "name": "Lojistik Takip Sistemi",
        "key": "LOG",
        "description": "Araç takibi, rota optimizasyonu ve teslimat bildirimleri için gerçek zamanlı lojistik platformu. Harita API ve WebSocket entegrasyonu içerir.",
        "methodology": Methodology.KANBAN,
        "status": "ACTIVE",
        "manager_email": "mustafa.demir@firma.com",
        "labels": ["Maps", "WebSocket", "Realtime", "Mobile", "Tracking"],
        "template_name": "Kanban",
    },
    {
        "name": "Sağlık Bilgi Sistemi",
        "key": "HIS",
        "description": "Hasta kayıtları, randevu yönetimi ve klinik karar destek sistemi. HL7 FHIR standardına uygunluk ve KVKK gereksinimi kritik öneme sahiptir.",
        "methodology": Methodology.WATERFALL,
        "status": "ACTIVE",
        "manager_email": "emine.yildiz@firma.com",
        "labels": ["HL7", "FHIR", "KVKK", "Healthcare", "Integration"],
        "template_name": "V-Modeli",
    },
    {
        "name": "Online Eğitim Platformu",
        "key": "EDU",
        "description": "Video dersler, quiz motoru, ilerleme takibi ve canlı oturum yönetimini kapsayan eğitim platformu. 50.000+ öğrenci hedeflenmektedir.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "omer.celik@firma.com",
        "labels": ["Video", "Quiz", "LiveSession", "Frontend", "Backend"],
        "template_name": "Scrum",
    },
    {
        "name": "CRM Müşteri İlişkileri",
        "key": "CRM",
        "description": "Satış hunisi yönetimi, otomatik e-posta kampanyaları ve müşteri segmentasyon araçlarını içeren kurumsal CRM sistemi.",
        "methodology": Methodology.KANBAN,
        "status": "ACTIVE",
        "manager_email": "hatice.arslan@firma.com",
        "labels": ["Sales", "Email", "Segmentation", "Analytics", "Automation"],
        "template_name": "Kanban",
    },
    {
        "name": "Otomotiv Test Otomasyon",
        "key": "AUTO",
        "description": "Araç yazılımı için HIL (Hardware-in-the-Loop) test senaryoları ve otomatik regresyon test koşum altyapısı. ISO 26262 uyum gereksinimi.",
        "methodology": Methodology.WATERFALL,
        "status": "ACTIVE",
        "manager_email": "ibrahim.aydin@firma.com",
        "labels": ["HIL", "ISO26262", "Testing", "Automotive", "Embedded"],
        "template_name": "V-Modeli + Scrum İç Döngüleri",
    },
    {
        "name": "Telekom Fatura Yönetimi",
        "key": "TEL",
        "description": "Abonelik bazlı faturalama, toplu fatura işleme ve ödeme uzlaştırma modüllerini kapsayan OSS/BSS sistemi.",
        "methodology": Methodology.WATERFALL,
        "status": "ON_HOLD",
        "manager_email": "merve.ozturk@firma.com",
        "labels": ["Billing", "OSS", "BSS", "Batch", "Reconciliation"],
        "template_name": "PRINCE2 (Proje Yönetimi)",
    },
    {
        "name": "Oyun Backend Servisleri",
        "key": "GAME",
        "description": "Liderlik tablosu, başarı sistemi, anlık matchmaking ve in-game ekonomi servisleri. 1M+ eşzamanlı kullanıcı hedefli yatay ölçeklenebilir mimari.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "huseyin.kurt@firma.com",
        "labels": ["Realtime", "Matchmaking", "Leaderboard", "Redis", "Scalability"],
        "template_name": "SAFe (Ölçekli Çevik)",
    },
    {
        "name": "IoT Sensör İzleme Platformu",
        "key": "IOT",
        "description": "Endüstriyel IoT sensörlerinden gelen telemetri verilerinin toplanması, eşik alarm yönetimi ve makine öğrenmesi tabanlı anomali tespiti.",
        "methodology": Methodology.KANBAN,
        "status": "ACTIVE",
        "manager_email": "selin.yilmaz@firma.com",
        "labels": ["MQTT", "TimeSeries", "Anomaly", "Dashboard", "ML"],
        "template_name": "Lean / Sürekli Teslimat",
    },
    {
        "name": "Blockchain Tedarik Zinciri",
        "key": "BLC",
        "description": "Ürün provenance takibi, akıllı kontrat tabanlı ödeme tetikleyicileri ve değiştirilemez denetim kayıtları için özel blockchain ağı.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "serkan.dogan@firma.com",
        "labels": ["Blockchain", "SmartContract", "Solidity", "Provenance", "Audit"],
        "template_name": "Scrum",
    },
    {
        "name": "ERP Modül Entegrasyonu",
        "key": "ERP",
        "description": "SAP ve Oracle ERP sistemleri arası veri senkronizasyonu, master data yönetimi ve iş akışı otomasyonu entegrasyon projesi.",
        "methodology": Methodology.WATERFALL,
        "status": "COMPLETED",
        "manager_email": "busra.koc@firma.com",
        "labels": ["SAP", "Oracle", "ETL", "MasterData", "Workflow"],
        "template_name": "Waterfall",
    },
    {
        "name": "Chatbot & Konuşma AI",
        "key": "BOT",
        "description": "Çok kanallı (web, WhatsApp, Telegram) yapay zeka destekli müşteri hizmetleri chatbotu. NLP motoru ve dialog yönetim sistemi entegrasyonu.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "ahmet.kaya@firma.com",
        "labels": ["NLP", "DialogFlow", "WhatsApp", "AI", "Chatbot"],
        "template_name": "RUP (Rasyonel Birleşik Süreç)",
    },
    {
        "name": "Sigorta Poliçe Platformu",
        "key": "INS",
        "description": "Kasko, konut ve sağlık sigortası poliçe yönetimi, hasar tazminat süreçleri ve aktüeryal hesaplama motoru içeren çekirdek sigorta platformu.",
        "methodology": Methodology.WATERFALL,
        "status": "ACTIVE",
        "manager_email": "fatma.sahin@firma.com",
        "labels": ["Policy", "Claims", "Actuarial", "Compliance", "Core"],
        "template_name": "V-Modeli",
    },
    {
        "name": "Hızlı Prototip Geliştirme",
        "key": "RAD1",
        "description": "Müşteri odaklı hızlı prototipleme: kullanıcı geri bildirimleri ile iteratif MVP üretimi. Zaman kutusu 4 hafta, değişken kapsam.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "mustafa.demir@firma.com",
        "labels": ["Prototype", "MVP", "UserFeedback", "Rapid", "Iteration"],
        "template_name": "RAD (Hızlı Uygulama Geliştirme)",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# 12 KAPSAMLI YAŞAM DÖNGÜSÜ ŞABLONLARI
# Her node ID: ^nd_[A-Za-z0-9_-]{10}$  (nd_ + tam 10 alfanümerik/tire/alt çizgi)
# ─────────────────────────────────────────────────────────────────────────────

LIFECYCLE_TEMPLATES = [

    # ──────────── 1. V-MODELİ ────────────
    {
        "name": "V-Modeli",
        "is_builtin": True,
        "description": (
            "Waterfall'ın doğrulama/geçerleme odaklı versiyonu. Sol kol geliştirme fazlarını "
            "(gereksinimden kodlamaya), sağ kol test fazlarını (birim testinden kabul testine) temsil eder. "
            "Her geliştirme fazı karşı test fazıyla dikey olarak eşleşir: Gereksinim ↔ Kabul Testi, "
            "Sistem Tasarımı ↔ Sistem Testi, Mimari Tasarım ↔ Entegrasyon Testi, Modül Tasarımı ↔ Birim Testi."
        ),
        "columns": [
            {"name": "Gereksinim Analizi", "order": 0},
            {"name": "Sistem Tasarımı",    "order": 1},
            {"name": "Mimari Tasarım",     "order": 2},
            {"name": "Modül Tasarımı",     "order": 3},
            {"name": "Kodlama",            "order": 4},
            {"name": "Birim Testi",        "order": 5},
            {"name": "Entegrasyon Testi",  "order": 6},
            {"name": "Sistem Testi",       "order": 7},
            {"name": "Kabul Testi",        "order": 8},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "strict_dependencies": True, "wip_limits": False},
        "cycle_label_tr": "Faz",
        "cycle_label_en": "Phase",
        "default_artifacts": [
            {"name": "Sistem Gereksinimleri Dokümanı (SRS)", "description": "Tüm fonksiyonel ve fonksiyonel olmayan gereksinimleri içerir."},
            {"name": "Mimari Tasarım Dokümanı (ADD)",         "description": "Sistem mimarisi, bileşenler ve arayüzler."},
            {"name": "Test Planı",                            "description": "Test stratejisi, kapsam ve takvim."},
            {"name": "Birim Test Raporu",                     "description": "Modül bazlı test sonuçları ve kapsam metrikleri."},
            {"name": "Entegrasyon Test Raporu",               "description": "Bileşen entegrasyon senaryoları ve sonuçlar."},
            {"name": "Kabul Test Raporu",                     "description": "Müşteri kabul kriterleri ve onay kaydı."},
        ],
        "default_phase_criteria": {
            "nd_vmreqs0001": "SRS belgesi onaylanmış ve izlenebilirlik matrisi tamamlanmış",
            "nd_vmsdes0002": "Sistem tasarım dokümanı imzalanmış",
            "nd_vmarch0003": "Mimari tasarım gözden geçirme toplantısı yapılmış",
            "nd_vmmodd0004": "Tüm modül arayüzleri tanımlanmış",
            "nd_vmcode0005": "Kod incelmesi tamamlanmış, statik analiz sorunsuz",
            "nd_vmunit0006": "Birim test kapsamı ≥ %80, tüm kritik yollar geçiyor",
            "nd_vmintg0007": "Tüm arayüz testleri geçiyor, performans kriterleri karşılanıyor",
            "nd_vmsyst0008": "Sistem testi senaryolarının %100'ü tamamlanmış",
            "nd_vmacpt0009": "Müşteri onayı alınmış, GAP listesi sıfırlanmış",
        },
        "default_workflow": {
            "mode": "sequential-locked",
            "nodes": [
                # Sol kol — Geliştirme fazları (yukarıdan aşağıya)
                {"id": "nd_vmreqs0001", "name": "Gereksinim Analizi",
                 "description": "Paydaş gereksinimleri toplanır, SRS belgesi hazırlanır, izlenebilirlik matrisi oluşturulur.",
                 "x": 60,  "y": 60,  "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_vmsdes0002", "name": "Sistem Tasarımı",
                 "description": "Yüksek düzey sistem mimarisi, donanım/yazılım bölümlemesi ve arayüz gereksinimleri tanımlanır.",
                 "x": 220, "y": 190, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_vmarch0003", "name": "Mimari Tasarım",
                 "description": "Alt sistem mimarisi, modüller arası arayüzler ve veri akışı diyagramları oluşturulur.",
                 "x": 380, "y": 320, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_vmmodd0004", "name": "Modül Tasarımı",
                 "description": "Her modülün iç mantığı, algoritmaları ve veri yapıları ayrıntılı olarak tasarlanır.",
                 "x": 540, "y": 450, "color": "status-progress", "is_initial": False, "is_final": False},
                # Alt — Kodlama (V'nin dip noktası)
                {"id": "nd_vmcode0005", "name": "Kodlama / Uygulama",
                 "description": "Tasarıma uygun kaynak kodu yazılır; kod incelemesi ve statik analiz uygulanır.",
                 "x": 700, "y": 530, "color": "status-progress", "is_initial": False, "is_final": False},
                # Sağ kol — Test fazları (aşağıdan yukarıya)
                {"id": "nd_vmunit0006", "name": "Birim Testi",
                 "description": "Her modül bağımsız olarak test edilir. Modül Tasarımı dokümanı test kriterleri kaynağıdır.",
                 "x": 860, "y": 450, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vmintg0007", "name": "Entegrasyon Testi",
                 "description": "Modüller birleştirilerek arayüz ve iletişim testleri yapılır. Mimari Tasarım baz alınır.",
                 "x": 1020,"y": 320, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vmsyst0008", "name": "Sistem Testi",
                 "description": "Tüm sistem bütünlüğü, performans, güvenlik ve yük testleri gerçekleştirilir.",
                 "x": 1180,"y": 190, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vmacpt0009", "name": "Kabul Testi",
                 "description": "Müşteri gereksinimlerine göre son doğrulama yapılır ve proje teslim onayı alınır.",
                 "x": 1340,"y": 60,  "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                # Sol kol akışı (sequential-down)
                {"id": "e_vm01", "source": "nd_vmreqs0001", "target": "nd_vmsdes0002", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm02", "source": "nd_vmsdes0002", "target": "nd_vmarch0003", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm03", "source": "nd_vmarch0003", "target": "nd_vmmodd0004", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm04", "source": "nd_vmmodd0004", "target": "nd_vmcode0005", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                # Sağ kol akışı (sequential-up)
                {"id": "e_vm05", "source": "nd_vmcode0005", "target": "nd_vmunit0006", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm06", "source": "nd_vmunit0006", "target": "nd_vmintg0007", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm07", "source": "nd_vmintg0007", "target": "nd_vmsyst0008", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm08", "source": "nd_vmsyst0008", "target": "nd_vmacpt0009", "type": "flow",         "label": None,                  "bidirectional": False, "is_all_gate": False},
                # Dikey doğrulama köprüleri (verification type)
                {"id": "e_vm09", "source": "nd_vmreqs0001", "target": "nd_vmacpt0009", "type": "verification", "label": "Gereksinim ↔ Kabul",  "bidirectional": True,  "is_all_gate": False},
                {"id": "e_vm10", "source": "nd_vmsdes0002", "target": "nd_vmsyst0008", "type": "verification", "label": "Sistem ↔ Sistem Testi","bidirectional": True,  "is_all_gate": False},
                {"id": "e_vm11", "source": "nd_vmarch0003", "target": "nd_vmintg0007", "type": "verification", "label": "Mimari ↔ Entegrasyon", "bidirectional": True,  "is_all_gate": False},
                {"id": "e_vm12", "source": "nd_vmmodd0004", "target": "nd_vmunit0006", "type": "verification", "label": "Modül ↔ Birim Testi",  "bidirectional": True,  "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_vmleft", "name": "Doğrulama Kolu (Geliştirme)",
                 "color": "#3B82F6",
                 "children": ["nd_vmreqs0001","nd_vmsdes0002","nd_vmarch0003","nd_vmmodd0004","nd_vmcode0005"]},
                {"id": "gr_vmright","name": "Geçerleme Kolu (Test)",
                 "color": "#10B981",
                 "children": ["nd_vmunit0006","nd_vmintg0007","nd_vmsyst0008","nd_vmacpt0009"]},
            ],
        },
    },

    # ──────────── 2. V-MODELİ + SCRUM İÇ DÖNGÜLER ────────────
    {
        "name": "V-Modeli + Scrum İç Döngüleri",
        "is_builtin": True,
        "description": (
            "Hibrit V-Model: Sol kol klasik V-Model spesifikasyon fazlarıdır. "
            "Sağ koldaki test fazları ise birer Scrum Sprint döngüsü olarak yürütülür — "
            "birim, entegrasyon ve sistem testi her biri 1-2 haftalık sprint kutularında "
            "iteratif olarak tekrarlanabilir. Büyük gömülü sistemler ve güvenlik kritik projelerde kullanılır."
        ),
        "columns": [
            {"name": "Gereksinim", "order": 0},
            {"name": "Tasarım",   "order": 1},
            {"name": "Kodlama",   "order": 2},
            {"name": "Test Sprint Backlog", "order": 3},
            {"name": "Test In Progress",   "order": 4},
            {"name": "Test Done",          "order": 5},
            {"name": "Kabul",              "order": 6},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": True, "strict_dependencies": True, "wip_limits": False},
        "cycle_label_tr": "Test Sprinti",
        "cycle_label_en": "Test Sprint",
        "default_workflow": {
            "mode": "sequential-flexible",
            "nodes": [
                {"id": "nd_vsreqs0001", "name": "Gereksinim Analizi",
                 "description": "SRS ve izlenebilirlik matrisi. Kabul kriterleri tanımlanır.",
                 "x": 60,  "y": 60,  "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_vssdes0002", "name": "Sistem & Mimari Tasarım",
                 "description": "Yüksek düzey ve alçak düzey tasarım birleştirilir.",
                 "x": 220, "y": 190, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_vsmodd0003", "name": "Modül Tasarımı",
                 "description": "Bileşen bazlı ayrıntılı tasarım ve arayüz sözleşmeleri.",
                 "x": 380, "y": 320, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_vscode0004", "name": "Kodlama",
                 "description": "TDD ile kod geliştirme; her commit CI pipeline'ını tetikler.",
                 "x": 540, "y": 450, "color": "status-progress", "is_initial": False, "is_final": False},
                # Sağ kol — Scrum sprint döngüsü içinde test fazları
                {"id": "nd_vsunit0005", "name": "Birim Test Sprinti",
                 "description": "1 haftalık sprint: her modül için otomatik birim testleri yazılır ve geçirilir.",
                 "x": 700, "y": 450, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vsintg0006", "name": "Entegrasyon Test Sprinti",
                 "description": "2 haftalık sprint: servisler arası uçtan uca senaryolar otomatize edilir.",
                 "x": 860, "y": 320, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vssyst0007", "name": "Sistem Test Sprinti",
                 "description": "2 haftalık sprint: performans, güvenlik ve yük testleri gerçekleştirilir.",
                 "x": 1020,"y": 190, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_vsacpt0008", "name": "Kabul Testi",
                 "description": "Müşteri ile birlikte UAT. Tüm gereksinim izleme öğelerinin karşılandığı doğrulanır.",
                 "x": 1180,"y": 60,  "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_vs01", "source": "nd_vsreqs0001", "target": "nd_vssdes0002", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs02", "source": "nd_vssdes0002", "target": "nd_vsmodd0003", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs03", "source": "nd_vsmodd0003", "target": "nd_vscode0004", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs04", "source": "nd_vscode0004", "target": "nd_vsunit0005", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs05", "source": "nd_vsunit0005", "target": "nd_vsintg0006", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs06", "source": "nd_vsintg0006", "target": "nd_vssyst0007", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs07", "source": "nd_vssyst0007", "target": "nd_vsacpt0008", "type": "flow",         "label": None,                     "bidirectional": False, "is_all_gate": False},
                # Scrum feedback döngüleri — test'ten koda geri bildirim
                {"id": "e_vs08", "source": "nd_vsunit0005", "target": "nd_vscode0004", "type": "feedback",     "label": "Hata düzeltme sprinti",  "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs09", "source": "nd_vsintg0006", "target": "nd_vscode0004", "type": "feedback",     "label": "Entegrasyon hatası",     "bidirectional": False, "is_all_gate": False},
                {"id": "e_vs10", "source": "nd_vssyst0007", "target": "nd_vscode0004", "type": "feedback",     "label": "Sistem regresyonu",      "bidirectional": False, "is_all_gate": False},
                # Doğrulama köprüleri
                {"id": "e_vs11", "source": "nd_vsreqs0001", "target": "nd_vsacpt0008", "type": "verification", "label": "Gereksinim ↔ Kabul",    "bidirectional": True,  "is_all_gate": False},
                {"id": "e_vs12", "source": "nd_vssdes0002", "target": "nd_vssyst0007", "type": "verification", "label": "Tasarım ↔ Sistem Testi", "bidirectional": True,  "is_all_gate": False},
                {"id": "e_vs13", "source": "nd_vsmodd0003", "target": "nd_vsunit0005", "type": "verification", "label": "Modül ↔ Birim Testi",   "bidirectional": True,  "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_vsleft",  "name": "Spesifikasyon Kolu",  "color": "#3B82F6",
                 "children": ["nd_vsreqs0001","nd_vssdes0002","nd_vsmodd0003","nd_vscode0004"]},
                {"id": "gr_vsright", "name": "Scrum Test Sprintleri","color": "#F59E0B",
                 "children": ["nd_vsunit0005","nd_vsintg0006","nd_vssyst0007","nd_vsacpt0008"]},
            ],
        },
    },

    # ──────────── 3. SPIRAL MODEL ────────────
    {
        "name": "Spiral Model",
        "is_builtin": True,
        "description": (
            "Boehm'in spiral modeli: risk odaklı iteratif geliştirme. "
            "Her döngü (spiral) dört kadranı geçer: (1) Hedefleri/alternatifleri belirleme ve kısıtları tanımlama, "
            "(2) Alternatifleri değerlendirme ve risk analizi, (3) Geliştirme ve doğrulama, "
            "(4) Sonraki aşamayı planlama. Yüksek riskli, büyük ölçekli sistem projelerinde kullanılır."
        ),
        "columns": [
            {"name": "Planlama",     "order": 0},
            {"name": "Risk Analizi", "order": 1},
            {"name": "Geliştirme",   "order": 2},
            {"name": "Değerlendirme","order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Spiral",
        "cycle_label_en": "Spiral",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                # Spiral 1 — Konsept & Fizibilite
                {"id": "nd_sp1pln0001", "name": "S1: Hedef & Planlama",
                 "description": "Proje hedefleri, kısıtlar ve alternatifler belirlenir. İlk risk listesi oluşturulur.",
                 "x": 200, "y": 150, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_sp1rsk0002", "name": "S1: Risk Analizi",
                 "description": "Teknik ve iş riskleri önceliklendirilir. Kritik riskler için prototip kararı alınır.",
                 "x": 400, "y": 100, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp1eng0003", "name": "S1: Kavram Prototipi",
                 "description": "Yüksek riskli alanlar için throwaway prototip geliştirilir.",
                 "x": 500, "y": 300, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp1eva0004", "name": "S1: Müşteri Değerlendirmesi",
                 "description": "Prototip müşteriyle gözden geçirilir; sonraki spiral için giriş alınır.",
                 "x": 280, "y": 370, "color": "status-review",   "is_initial": False, "is_final": False},
                # Spiral 2 — Gereksinim & Mimari
                {"id": "nd_sp2pln0005", "name": "S2: Gereksinim Planı",
                 "description": "Tam gereksinim kümesi tanımlanır; mimari alternatifleri listelenir.",
                 "x": 120, "y": 80,  "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_sp2rsk0006", "name": "S2: Risk Azaltma",
                 "description": "Kalan riskler için simülasyon veya benchmark yapılır.",
                 "x": 600, "y": 60,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp2eng0007", "name": "S2: Yazılım Geliştirme",
                 "description": "Doğrulanmış mimariye göre temel modüller geliştirilir.",
                 "x": 700, "y": 420, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp2eva0008", "name": "S2: Entegrasyon Değerlendirmesi",
                 "description": "İnşa edilen sistem test edilir; müşteri ile inceleme toplantısı yapılır.",
                 "x": 120, "y": 500, "color": "status-review",   "is_initial": False, "is_final": False},
                # Spiral 3 — Tam Geliştirme & Doğrulama
                {"id": "nd_sp3pln0009", "name": "S3: Son Planlama",
                 "description": "Tam özellik kümesi kilitlenir; release planı oluşturulur.",
                 "x": 60,  "y": 30,  "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_sp3eng0010", "name": "S3: Tam Uygulama",
                 "description": "Tüm özellikler tamamlanır, kapsamlı test suite çalıştırılır.",
                 "x": 800, "y": 530, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp3eva0011", "name": "S3: Geçerleme",
                 "description": "Sistem geçerleme testleri ve müşteri kabul testleri gerçekleştirilir.",
                 "x": 80,  "y": 620, "color": "status-review",   "is_initial": False, "is_final": False},
                # Final
                {"id": "nd_spfinal001", "name": "Ürün Teslimatı",
                 "description": "Onaylı ürün canlıya alınır; bakım planı devreye girer.",
                 "x": 950, "y": 300, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                # Spiral 1
                {"id": "e_sp01", "source": "nd_sp1pln0001", "target": "nd_sp1rsk0002", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp02", "source": "nd_sp1rsk0002", "target": "nd_sp1eng0003", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp03", "source": "nd_sp1eng0003", "target": "nd_sp1eva0004", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                # Spiral 1→2 geçiş
                {"id": "e_sp04", "source": "nd_sp1eva0004", "target": "nd_sp2pln0005", "type": "flow",     "label": "Sonraki spiral",  "bidirectional": False, "is_all_gate": False},
                # Spiral 2
                {"id": "e_sp05", "source": "nd_sp2pln0005", "target": "nd_sp2rsk0006", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp06", "source": "nd_sp2rsk0006", "target": "nd_sp2eng0007", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp07", "source": "nd_sp2eng0007", "target": "nd_sp2eva0008", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                # Spiral 2→3 geçiş
                {"id": "e_sp08", "source": "nd_sp2eva0008", "target": "nd_sp3pln0009", "type": "flow",     "label": "Sonraki spiral",  "bidirectional": False, "is_all_gate": False},
                # Spiral 3
                {"id": "e_sp09", "source": "nd_sp3pln0009", "target": "nd_sp3eng0010", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp10", "source": "nd_sp3eng0010", "target": "nd_sp3eva0011", "type": "flow",     "label": None,              "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp11", "source": "nd_sp3eva0011", "target": "nd_spfinal001", "type": "flow",     "label": "Teslim",          "bidirectional": False, "is_all_gate": False},
                # Risk analizi geri bildirimi
                {"id": "e_sp12", "source": "nd_sp1rsk0002", "target": "nd_sp1pln0001", "type": "feedback", "label": "Risk → Yeniden Planla", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp13", "source": "nd_sp2rsk0006", "target": "nd_sp2pln0005", "type": "feedback", "label": "Risk → Yeniden Planla", "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_sp1", "name": "Spiral 1 — Konsept",    "color": "#6366F1", "children": ["nd_sp1pln0001","nd_sp1rsk0002","nd_sp1eng0003","nd_sp1eva0004"]},
                {"id": "gr_sp2", "name": "Spiral 2 — Geliştirme", "color": "#8B5CF6", "children": ["nd_sp2pln0005","nd_sp2rsk0006","nd_sp2eng0007","nd_sp2eva0008"]},
                {"id": "gr_sp3", "name": "Spiral 3 — Teslimat",   "color": "#A78BFA", "children": ["nd_sp3pln0009","nd_sp3eng0010","nd_sp3eva0011","nd_spfinal001"]},
            ],
        },
    },

    # ──────────── 4. RUP (RASYONEL BİRLEŞİK SÜREÇ) ────────────
    {
        "name": "RUP (Rasyonel Birleşik Süreç)",
        "is_builtin": True,
        "description": (
            "Rational Unified Process: Use-case odaklı, mimari merkezli, iteratif artımlı süreç. "
            "4 faz × N iterasyon: Başlangıç (vizyon, fizibilite), Hazırlık (mimari temel, risk azaltma), "
            "İnşaat (artımlı özellik geliştirme), Geçiş (beta, eğitim, dağıtım). "
            "Her faz birden fazla UML çalışma akışını paralel yürütür."
        ),
        "columns": [
            {"name": "Başlangıç",   "order": 0},
            {"name": "Hazırlık",   "order": 1},
            {"name": "İnşaat",     "order": 2},
            {"name": "Geçiş",      "order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Faz",
        "cycle_label_en": "Phase",
        "default_workflow": {
            "mode": "sequential-flexible",
            "nodes": [
                {"id": "nd_rupinit001", "name": "Başlangıç (Inception)",
                 "description": "İş vakası ve kapsam belirlenir. Paydaş mutabakatı ve fizibilite tamamlanır. Yaşam döngüsü hedefi milestone'u geçilir.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_rupelab001", "name": "Hazırlık (Elaboration)",
                 "description": "Mimari temel inşa edilir. Yüksek riskli use-case'ler implement edilir. Yaşam döngüsü mimarisi milestone'u.",
                 "x": 340, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_rupcons001", "name": "İnşaat (Construction)",
                 "description": "İlk operasyonel yetenek milestone'una doğru tüm özellikler iteratif geliştirilir. Test edilebilir beta ürünü ortaya çıkar.",
                 "x": 620, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_ruptran001", "name": "Geçiş (Transition)",
                 "description": "Beta dağıtımı, kullanıcı geri bildirimleri, hata giderme ve son eğitimler. Ürün teslimi milestone'u.",
                 "x": 900, "y": 120, "color": "status-done",     "is_initial": False, "is_final": True},
                # Çalışma akışı (workflow) aktiviteleri — yatay bantlar
                {"id": "nd_rupucwf001", "name": "Use-Case Modelleme",
                 "description": "Aktörler, use-case'ler ve sistem sınırı tanımlanır; tüm fazlar boyunca rafine edilir.",
                 "x": 340, "y": 280, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_rupanlz001", "name": "Analiz & Tasarım",
                 "description": "UML sınıf, sıralama ve işbirliği diyagramları; mimari stillerin seçimi.",
                 "x": 620, "y": 280, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_rupimpl001", "name": "Uygulama",
                 "description": "Kaynak kodu, bileşen katmanı, birim test ve kod entegrasyonu.",
                 "x": 620, "y": 380, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_ruptst0001", "name": "Test",
                 "description": "Güvenilirlik, işlevsellik ve performans testleri. Hata izleme ve regresyon.",
                 "x": 900, "y": 280, "color": "status-review",   "is_initial": False, "is_final": False},
            ],
            "edges": [
                # Ana faz akışı
                {"id": "e_rup01", "source": "nd_rupinit001", "target": "nd_rupelab001", "type": "flow",     "label": "LC Hedefi Milestone", "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup02", "source": "nd_rupelab001", "target": "nd_rupcons001", "type": "flow",     "label": "LC Mimari Milestone", "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup03", "source": "nd_rupcons001", "target": "nd_ruptran001", "type": "flow",     "label": "İlk Operasyonel Yetenek","bidirectional": False,"is_all_gate": False},
                # Çalışma akışı bağlantıları
                {"id": "e_rup04", "source": "nd_rupelab001", "target": "nd_rupucwf001", "type": "flow",     "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup05", "source": "nd_rupucwf001", "target": "nd_rupanlz001", "type": "flow",     "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup06", "source": "nd_rupanlz001", "target": "nd_rupimpl001", "type": "flow",     "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup07", "source": "nd_rupimpl001", "target": "nd_ruptst0001", "type": "flow",     "label": None,                  "bidirectional": False, "is_all_gate": False},
                {"id": "e_rup08", "source": "nd_ruptst0001", "target": "nd_ruptran001", "type": "flow",     "label": None,                  "bidirectional": False, "is_all_gate": False},
                # İterasyonlar geri bildirimi (Hazırlık/İnşaat arasında)
                {"id": "e_rup09", "source": "nd_rupcons001", "target": "nd_rupelab001", "type": "feedback", "label": "Mimari revizyonu",    "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_rupphase", "name": "Faz Akışı",        "color": "#0EA5E9", "children": ["nd_rupinit001","nd_rupelab001","nd_rupcons001","nd_ruptran001"]},
                {"id": "gr_rupwf",    "name": "Çalışma Akışları", "color": "#6366F1", "children": ["nd_rupucwf001","nd_rupanlz001","nd_rupimpl001","nd_ruptst0001"]},
            ],
        },
    },

    # ──────────── 5. XP (AŞIRI PROGRAMLAMA) ────────────
    {
        "name": "XP (Aşırı Programlama)",
        "is_builtin": True,
        "description": (
            "Extreme Programming: Çok sık entegrasyon, çift programlama, test-önce geliştirme (TDD) "
            "ve küçük sürümler üzerine kurulu çevik metodoloji. Keşif → Planlama → İterasyonlar "
            "(her 1-2 hafta) → Ürünleştirme → Bakım. Özellik değişikliğine maksimum esneklik sağlar."
        ),
        "columns": [
            {"name": "Hikaye Backlog", "order": 0},
            {"name": "Bu İterasyon",  "order": 1},
            {"name": "Geliştirme",    "order": 2},
            {"name": "Test",          "order": 3},
            {"name": "Tamamlandı",    "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": True, "wip_limits": True},
        "cycle_label_tr": "İterasyon",
        "cycle_label_en": "Iteration",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_xpexplr001", "name": "Keşif",
                 "description": "Kullanıcı hikayeleri yazılır, teknik tahminler yapılır, sistem metaforu oluşturulur.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_xpplan0001", "name": "Planlama Oyunu",
                 "description": "Müşteri önceliklendirir, geliştiriciler tahmin verir; iterasyon içeriği kararlaştırılır.",
                 "x": 280, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_xpiter0001", "name": "İterasyon (TDD + Çift Programlama)",
                 "description": "Test-önce yazılır → Kodu geç → Refactor. Çift programlama zorunludur. Sürekli entegrasyon saatlik.",
                 "x": 500, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_xpaccp0001", "name": "Kabul Testleri",
                 "description": "Müşteri hikayelere karşılık kabul testlerini çalıştırır; geçen hikayeler tamamlanmış sayılır.",
                 "x": 720, "y": 120, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_xpprod0001", "name": "Küçük Sürüm",
                 "description": "Çalışan yazılım müşteriye teslim edilir. Geri bildirim bir sonraki planlama oyununa girer.",
                 "x": 940, "y": 120, "color": "status-done",     "is_initial": False, "is_final": False},
                {"id": "nd_xpmant0001", "name": "Bakım & Evrim",
                 "description": "Üretim desteği, refactoring ve yeni hikayelerin sisteme entegrasyonu.",
                 "x": 1160,"y": 120, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_xp01", "source": "nd_xpexplr001", "target": "nd_xpplan0001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp02", "source": "nd_xpplan0001", "target": "nd_xpiter0001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp03", "source": "nd_xpiter0001", "target": "nd_xpaccp0001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp04", "source": "nd_xpaccp0001", "target": "nd_xpprod0001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp05", "source": "nd_xpprod0001", "target": "nd_xpmant0001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                # İterasyon döngüsü — merkezi XP ritmi
                {"id": "e_xp06", "source": "nd_xpaccp0001", "target": "nd_xpplan0001", "type": "feedback", "label": "Yeni hikayeler → Plan",   "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp07", "source": "nd_xpiter0001", "target": "nd_xpplan0001", "type": "feedback", "label": "Tasarım değişikliği",     "bidirectional": False, "is_all_gate": False},
                {"id": "e_xp08", "source": "nd_xpmant0001", "target": "nd_xpplan0001", "type": "feedback", "label": "Bakım hikayeleri",        "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [],
        },
    },

    # ──────────── 6. DSDM ────────────
    {
        "name": "DSDM (Dinamik Sistem Geliştirme)",
        "is_builtin": True,
        "description": (
            "Dynamic Systems Development Method: zaman kutulu, kullanıcı odaklı, iteratif metodoloji. "
            "RAD'ın disiplinli hali. Temel ilke: zamanı ve maliyeti sabitle, kapsamı değiştir (MoSCoW). "
            "Ön Proje → Fizibilite → İş Araştırması → Fonksiyonel Model İterasyonu → "
            "Tasarım & İnşaat İterasyonu → Uygulama → Proje Sonrası."
        ),
        "columns": [
            {"name": "Ön Proje",       "order": 0},
            {"name": "Fizibilite",     "order": 1},
            {"name": "İş Araştırması", "order": 2},
            {"name": "FM İterasyonu",  "order": 3},
            {"name": "T&İ İterasyonu", "order": 4},
            {"name": "Uygulama",       "order": 5},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": True},
        "cycle_label_tr": "Zaman Kutusu",
        "cycle_label_en": "Timebox",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_dsdmpre001", "name": "Ön Proje",
                 "description": "Proje tetiklenebilirliği değerlendirilir. Sponsor ve iş şampiyonu belirlenir.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_dsdmfsb001", "name": "Fizibilite Araştırması",
                 "description": "Teknik ve iş fizibilitesi, proje kabul kriterleri ve risk özeti hazırlanır (2-3 hafta).",
                 "x": 280, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_dsdmbst001", "name": "İş Araştırması",
                 "description": "JAD oturumları ile süreç modelleri, varlık modeli ve önceliklendirilmiş gereksinim listesi üretilir.",
                 "x": 500, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_dsdmfmi001", "name": "Fonksiyonel Model İterasyonu",
                 "description": "MoSCoW önceliklerine göre işlevsel prototip geliştirilir ve kullanıcı ile gözden geçirilir.",
                 "x": 700, "y": 80,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_dsdmdbi001", "name": "Tasarım & İnşaat İterasyonu",
                 "description": "Tasarım protiplerine dayanarak sistem inşa edilir; her zaman kutusunda test edilir.",
                 "x": 700, "y": 180, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_dsdmimp001", "name": "Uygulama",
                 "description": "Sistem canlıya alınır; kullanıcı eğitimi, dokümantasyon ve destek devreye girer.",
                 "x": 900, "y": 130, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_dsdmpst001", "name": "Proje Sonrası",
                 "description": "Ders çıkarılan noktalar kaydedilir; artıkların sonraki projeye devri planlanır.",
                 "x": 1100,"y": 130, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_ds01", "source": "nd_dsdmpre001", "target": "nd_dsdmfsb001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds02", "source": "nd_dsdmfsb001", "target": "nd_dsdmbst001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds03", "source": "nd_dsdmbst001", "target": "nd_dsdmfmi001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds04", "source": "nd_dsdmbst001", "target": "nd_dsdmdbi001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds05", "source": "nd_dsdmfmi001", "target": "nd_dsdmimp001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds06", "source": "nd_dsdmdbi001", "target": "nd_dsdmimp001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds07", "source": "nd_dsdmimp001", "target": "nd_dsdmpst001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                # Zaman kutusu yineleme geri bildirimi
                {"id": "e_ds08", "source": "nd_dsdmfmi001", "target": "nd_dsdmfmi001", "type": "feedback", "label": "Sonraki FM zaman kutusu", "bidirectional": False, "is_all_gate": False},
                {"id": "e_ds09", "source": "nd_dsdmdbi001", "target": "nd_dsdmdbi001", "type": "feedback", "label": "Sonraki T&İ zaman kutusu","bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_dsdmpre", "name": "Proje Öncesi",  "color": "#64748B", "children": ["nd_dsdmpre001","nd_dsdmfsb001","nd_dsdmbst001"]},
                {"id": "gr_dsdmdev", "name": "Geliştirme",    "color": "#6366F1", "children": ["nd_dsdmfmi001","nd_dsdmdbi001","nd_dsdmimp001"]},
                {"id": "gr_dsdmpst", "name": "Proje Sonrası", "color": "#94A3B8", "children": ["nd_dsdmpst001"]},
            ],
        },
    },

    # ──────────── 7. FDD (ÖZELLİK ODAKLI GELİŞTİRME) ────────────
    {
        "name": "FDD (Özellik Odaklı Geliştirme)",
        "is_builtin": True,
        "description": (
            "Feature-Driven Development: Büyük ekipler için tasarlanmış iteratif süreç. "
            "5 süreç: (1) Genel model geliştir, (2) Özellik listesi oluştur, (3) Özelliğe göre planla, "
            "(4) Özelliğe göre tasarla, (5) Özelliğe göre inşa et. "
            "'Her iki haftada bir çalışan özellik' temel ölçüm birimidir."
        ),
        "columns": [
            {"name": "Özellik Listesi", "order": 0},
            {"name": "Tasarım",         "order": 1},
            {"name": "Geliştirme",      "order": 2},
            {"name": "İnceleme",        "order": 3},
            {"name": "Tamamlandı",      "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": True},
        "cycle_label_tr": "Özellik Paketi",
        "cycle_label_en": "Feature Set",
        "default_workflow": {
            "mode": "sequential-flexible",
            "nodes": [
                {"id": "nd_fdddoml001", "name": "Genel Model Geliştir",
                 "description": "Alan uzmanları ile nesne modeli, sınıf diyagramı ve etki alanı sözlüğü oluşturulur.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_fddbfls001", "name": "Özellik Listesi Oluştur",
                 "description": "İşlevsel gereksinimler '<aksiyon> <sonuç> <nesne>' formatında özellik maddelerine ayrılır.",
                 "x": 300, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_fddpbyf001", "name": "Özelliğe Göre Planla",
                 "description": "Özellikler önceliklendirilir ve geliştirici/sınıf sahiplerine atanır; takvim oluşturulur.",
                 "x": 540, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_fdddbyf001", "name": "Özelliğe Göre Tasarla",
                 "description": "Özellik mühendisi sıralı diyagram üretir; sınıf sahipleri tasarımı inceler.",
                 "x": 780, "y": 80,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_fddbbyf001", "name": "Özelliğe Göre İnşa Et",
                 "description": "Kod yazılır, birim test edilir, incelenir ve yapıya entegre edilir. %100 özellik = sürüm.",
                 "x": 780, "y": 180, "color": "status-progress", "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_fd01", "source": "nd_fdddoml001", "target": "nd_fddbfls001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_fd02", "source": "nd_fddbfls001", "target": "nd_fddpbyf001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                {"id": "e_fd03", "source": "nd_fddpbyf001", "target": "nd_fdddbyf001", "type": "flow",     "label": "Her özellik paketi için",  "bidirectional": False, "is_all_gate": False},
                {"id": "e_fd04", "source": "nd_fdddbyf001", "target": "nd_fddbbyf001", "type": "flow",     "label": None,                      "bidirectional": False, "is_all_gate": False},
                # Özellik döngüsü
                {"id": "e_fd05", "source": "nd_fddbbyf001", "target": "nd_fdddbyf001", "type": "feedback", "label": "Sonraki özellik paketi",  "bidirectional": False, "is_all_gate": False},
                {"id": "e_fd06", "source": "nd_fdddbyf001", "target": "nd_fddpbyf001", "type": "feedback", "label": "Kapsam değişikliği",      "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_fddprj", "name": "Proje Kurulum Fazları",    "color": "#0EA5E9", "children": ["nd_fdddoml001","nd_fddbfls001","nd_fddpbyf001"]},
                {"id": "gr_fddftrs","name": "Özellik İterasyonları",    "color": "#10B981", "children": ["nd_fdddbyf001","nd_fddbbyf001"]},
            ],
        },
    },

    # ──────────── 8. SAFe (ÖLÇEKLI ÇEVİK) ────────────
    {
        "name": "SAFe (Ölçekli Çevik)",
        "is_builtin": True,
        "description": (
            "Scaled Agile Framework: Büyük kuruluşlarda çevik uygulamak için 3 katman: "
            "Portföy (stratejik epikler, AR/ART seçimi), "
            "Program (PI Planlama, Program Artışları, RTE koordinasyonu), "
            "Takım (Scrum/Kanban sprintleri). "
            "PI = Program Artışı (8-12 hafta, 4-6 sprint + IP Sprint)."
        ),
        "columns": [
            {"name": "Portföy Backlog", "order": 0},
            {"name": "PI Backlog",     "order": 1},
            {"name": "Sprint",         "order": 2},
            {"name": "System Demo",    "order": 3},
            {"name": "Released",       "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": True, "wip_limits": True},
        "cycle_label_tr": "Program Artışı (PI)",
        "cycle_label_en": "Program Increment (PI)",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                # Portföy katmanı
                {"id": "nd_safeprt001", "name": "Portföy Yönetimi",
                 "description": "Stratejik temalar ve epikler önceliklendirilir; ART (Agile Release Train) için bütçe tahsisi yapılır.",
                 "x": 60,  "y": 60,  "color": "status-todo",     "is_initial": True,  "is_final": False},
                # Program katmanı
                {"id": "nd_safepip001", "name": "PI Planlama",
                 "description": "2 günlük yüz yüze PI planlama etkinliği: tüm takımlar hedefleri, riskleri ve bağımlılıkları planlar.",
                 "x": 300, "y": 60,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_safespr001", "name": "Sprint Yürütme",
                 "description": "Takımlar 2 haftalık sprintlerde çalışır; Scrum of Scrums ile program koordinasyonu.",
                 "x": 540, "y": 60,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_safesdm001", "name": "Sistem Demo",
                 "description": "Her sprint sonunda tüm ART'ın entegre çalışan yazılımı müşteri / iş sahibine gösterilir.",
                 "x": 780, "y": 60,  "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_safeipa001", "name": "Denetle & Uyarla (I&A)",
                 "description": "PI kapanışında PI retrospektifi, çözüm demo ve problem çözme çalıştayı yapılır.",
                 "x": 1020,"y": 60,  "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_saferel001", "name": "Sürüm Yayını",
                 "description": "Demand management onayı ile sürüm canlıya alınır; metrikler portföy katmanına raporlanır.",
                 "x": 1260,"y": 60,  "color": "status-done",     "is_initial": False, "is_final": True},
                # IP Sprint (Inovasyon & Planlama)
                {"id": "nd_safeips001", "name": "İnovasyon & Planlama Sprinti",
                 "description": "Son sprint: teknik borç, inovasyon hackathon ve sonraki PI planlaması hazırlığı.",
                 "x": 780, "y": 160, "color": "status-progress", "is_initial": False, "is_final": False},
            ],
            "edges": [
                {"id": "e_sf01", "source": "nd_safeprt001", "target": "nd_safepip001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf02", "source": "nd_safepip001", "target": "nd_safespr001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf03", "source": "nd_safespr001", "target": "nd_safesdm001", "type": "flow",     "label": "Sprint sonu demo",      "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf04", "source": "nd_safespr001", "target": "nd_safeips001", "type": "flow",     "label": "IP Sprinti",            "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf05", "source": "nd_safesdm001", "target": "nd_safeipa001", "type": "flow",     "label": "PI kapanışı",           "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf06", "source": "nd_safeipa001", "target": "nd_saferel001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf07", "source": "nd_safeipa001", "target": "nd_safepip001", "type": "feedback", "label": "Sonraki PI planlaması", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sf08", "source": "nd_safeips001", "target": "nd_safesdm001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_sfprt", "name": "Portföy Katmanı", "color": "#7C3AED", "children": ["nd_safeprt001"]},
                {"id": "gr_sfprg", "name": "Program Katmanı", "color": "#2563EB", "children": ["nd_safepip001","nd_safesdm001","nd_safeipa001","nd_saferel001","nd_safeips001"]},
                {"id": "gr_sftm",  "name": "Takım Katmanı",   "color": "#059669", "children": ["nd_safespr001"]},
            ],
        },
    },

    # ──────────── 9. CRYSTAL CLEAR ────────────
    {
        "name": "Crystal Clear",
        "is_builtin": True,
        "description": (
            "Crystal Clear: Alistair Cockburn'ün hafif metodolojisi, 2-8 kişilik ortak mekânda çalışan ekipler için. "
            "İnsan merkezli: iletişim kanalları, yapı ve yetenekler birincil önceliklerdir. "
            "Teslimat döngüleri 2-3 aylık; periyodik yetersizlik testleri ilerinin güvencesi. "
            "Şartalandırma → Teslimat Döngüsü (yinelenebilir) → Kapanış."
        ),
        "columns": [
            {"name": "Şartalandırma", "order": 0},
            {"name": "İş Gereksinimi", "order": 1},
            {"name": "Tasarım",       "order": 2},
            {"name": "Kod & Test",    "order": 3},
            {"name": "Entegrasyon",   "order": 4},
            {"name": "Kullanıcı Testi","order": 5},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Teslimat Döngüsü",
        "cycle_label_en": "Delivery Cycle",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_crychar001", "name": "Şartalandırma",
                 "description": "Ekip oluşturulur, iş öncelikleri, teslimat döngüsü planı ve çalışma standartları kararlaştırılır.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_cryed00001", "name": "Kullanıcı Görüşmeleri",
                 "description": "Kullanıcı görüşmeleri ile gerçek ihtiyaçlar ve öncelikli özellikler belirlenir.",
                 "x": 280, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_crydlv0001", "name": "Teslimat Döngüsü",
                 "description": "2 haftalık adımlarla: günlük stand-up, birlikte kod geliştirme, kullanıcı yansıma toplantıları.",
                 "x": 500, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_cryust0001", "name": "Kullanıcı Kabul Testi",
                 "description": "Gerçek kullanıcılar sistemi test eder; %100 kabul oranı bir sonraki döngünün koşuludur.",
                 "x": 720, "y": 120, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_crywrp0001", "name": "Kapanış",
                 "description": "Ders çıkarılanlar, kapsam dışındaki öğeler ve ekip retrospektifi belgelenir.",
                 "x": 940, "y": 120, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_cc01", "source": "nd_crychar001", "target": "nd_cryed00001", "type": "flow",     "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_cc02", "source": "nd_cryed00001", "target": "nd_crydlv0001", "type": "flow",     "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_cc03", "source": "nd_crydlv0001", "target": "nd_cryust0001", "type": "flow",     "label": None,                     "bidirectional": False, "is_all_gate": False},
                {"id": "e_cc04", "source": "nd_cryust0001", "target": "nd_crywrp0001", "type": "flow",     "label": "Tüm döngüler tamamlandı","bidirectional": False, "is_all_gate": False},
                # Teslimat döngüsü yineleme
                {"id": "e_cc05", "source": "nd_cryust0001", "target": "nd_crydlv0001", "type": "feedback", "label": "Sonraki döngü",          "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [],
        },
    },

    # ──────────── 10. RAD (HIZLI UYGULAMA GELİŞTİRME) ────────────
    {
        "name": "RAD (Hızlı Uygulama Geliştirme)",
        "is_builtin": True,
        "description": (
            "Rapid Application Development: James Martin, 1991. Yoğun kullanıcı katılımı ve "
            "zaman kutulu iteratif prototipleme ile hızlı teslimat. "
            "4 faz: Gereksinim Planlaması → Kullanıcı Tasarımı (JAD oturumları + prototip) → "
            "İnşaat (paralel geliştirme araçları) → Sisteme Geçiş (test, eğitim, canlıya alım). "
            "Zaman hedefi: 60-90 gün."
        ),
        "columns": [
            {"name": "Gereksinim",    "order": 0},
            {"name": "Kullanıcı Tst", "order": 1},
            {"name": "İnşaat",        "order": 2},
            {"name": "Geçiş",         "order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Prototip Turu",
        "cycle_label_en": "Prototype Round",
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_radrpln001", "name": "Gereksinim Planlaması",
                 "description": "Yönetim ve kullanıcılar sistem hedefleri, gereksinimleri ve kısıtları üzerinde uzlaşır.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_raduds0001", "name": "Kullanıcı Tasarımı",
                 "description": "JAD oturumlarında kullanıcılar veri akışlarını ve süreçleri modeleyerek prototiplere dönüştürür.",
                 "x": 300, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_radcon0001", "name": "İnşaat",
                 "description": "CASE araçları ve yeniden kullanılabilir bileşenlerle paralel geliştirme yapılır.",
                 "x": 540, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_radcut0001", "name": "Sisteme Geçiş",
                 "description": "Kapsamlı test, kullanıcı eğitimi, veri dönüşümü ve canlıya geçiş yönetimi.",
                 "x": 780, "y": 120, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_rd01", "source": "nd_radrpln001", "target": "nd_raduds0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd02", "source": "nd_raduds0001", "target": "nd_radcon0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd03", "source": "nd_radcon0001", "target": "nd_radcut0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                # Kullanıcı tasarımı döngüsü
                {"id": "e_rd04", "source": "nd_raduds0001", "target": "nd_raduds0001", "type": "feedback", "label": "Prototip yineleme",     "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd05", "source": "nd_radcon0001", "target": "nd_raduds0001", "type": "feedback", "label": "Kullanıcı revizyonu",   "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [],
        },
    },

    # ──────────── 11. LEAN / SÜREKLİ TESLİMAT ────────────
    {
        "name": "Lean / Sürekli Teslimat",
        "is_builtin": True,
        "description": (
            "Lean Software Development + Continuous Delivery: israfı ortadan kaldır, akışı iyileştir, "
            "geri bildirim döngüsünü kısalt. "
            "Değer akışı: Keşfet → Geliştir (TDD, çift programlama) → Test (otomatize) → "
            "Yayınla (tek komutla CD) → İzle (metrikler, uyarılar) → Geri Bildirim. "
            "Teslim süresi birincil ölçüm. DORA metrikleri hedef."
        ),
        "columns": [
            {"name": "Keşfet",    "order": 0},
            {"name": "Geliştir",  "order": 1},
            {"name": "Test Et",   "order": 2, "wip_limit": 3},
            {"name": "Yayınla",   "order": 3, "wip_limit": 2},
            {"name": "İzle",      "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": True},
        "cycle_label_tr": "Akış Döngüsü",
        "cycle_label_en": "Flow Cycle",
        "default_workflow": {
            "mode": "continuous",
            "nodes": [
                {"id": "nd_lcddsc0001", "name": "Keşfet",
                 "description": "Kullanıcı geri bildirimleri, metrikler ve hipotezlerden özellik fikirleri üretilir.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_lcddvl0001", "name": "Geliştir",
                 "description": "TDD döngüsü: test yaz → kodu geç → refactor. Küçük, sık commitler. Feature flag arkasında.",
                 "x": 280, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_lcdtst0001", "name": "Test Et",
                 "description": "Otomatize birim + entegrasyon + E2E test paketi. Derleme hattı her commit'te çalışır.",
                 "x": 500, "y": 120, "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_lcdrls0001", "name": "Yayınla",
                 "description": "Blue/green veya canary dağıtım. İnsan müdahalesi sıfır — tek komutla CD.",
                 "x": 720, "y": 120, "color": "status-done",     "is_initial": False, "is_final": False},
                {"id": "nd_lcdmon0001", "name": "İzle",
                 "description": "Hata oranı, gecikme, iş metrikleri (dönüşüm, etkinleşme) gerçek zamanlı izlenir.",
                 "x": 940, "y": 120, "color": "status-done",     "is_initial": False, "is_final": False},
                {"id": "nd_lcdfdb0001", "name": "Geri Bildirim & Öğren",
                 "description": "Metrikler ve kullanıcı geri bildirimleri Keşfet fazına aktarılır; deney döngüsü yeniden başlar.",
                 "x": 700, "y": 240, "color": "status-progress", "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_lc01", "source": "nd_lcddsc0001", "target": "nd_lcddvl0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc02", "source": "nd_lcddvl0001", "target": "nd_lcdtst0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc03", "source": "nd_lcdtst0001", "target": "nd_lcdrls0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc04", "source": "nd_lcdrls0001", "target": "nd_lcdmon0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc05", "source": "nd_lcdmon0001", "target": "nd_lcdfdb0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                # Sürekli geri bildirim döngüleri
                {"id": "e_lc06", "source": "nd_lcdfdb0001", "target": "nd_lcddsc0001", "type": "feedback", "label": "Öğrenmeden geri keşif", "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc07", "source": "nd_lcdtst0001", "target": "nd_lcddvl0001", "type": "feedback", "label": "Test başarısız",        "bidirectional": False, "is_all_gate": False},
                {"id": "e_lc08", "source": "nd_lcdmon0001", "target": "nd_lcddvl0001", "type": "feedback", "label": "Üretim hatası",         "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [],
        },
    },

    # ──────────── 12. PRINCE2 (PROJE YÖNETİMİ) ────────────
    {
        "name": "PRINCE2 (Proje Yönetimi)",
        "is_builtin": True,
        "description": (
            "PRINCE2 (PRojects IN Controlled Environments): "
            "İngiltere kökenli süreç tabanlı proje yönetimi çerçevesi. "
            "7 prensip, 7 tema, 7 süreç. Her aşama bir Aşama Yetki Belgesi ile başlar; "
            "aşama sınırında Proje Yöneticisi Proje Kuruluna ilerleme hakkı için müracaat eder. "
            "İş vakası (business case) boyunca canlı tutulur."
        ),
        "columns": [
            {"name": "Başlatma",      "order": 0},
            {"name": "Yönetim",       "order": 1},
            {"name": "Kontrol",       "order": 2},
            {"name": "Ürün Teslimat", "order": 3},
            {"name": "Kapanış",       "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "strict_dependencies": True, "wip_limits": False},
        "cycle_label_tr": "Aşama",
        "cycle_label_en": "Stage",
        "default_artifacts": [
            {"name": "Proje Belgesi (PID)",      "description": "Proje kapsamı, yaklaşımı, iş vakası ve kontrol yapısını tanımlar."},
            {"name": "İş Vakası",                "description": "Projenin yatırım getirisini ve stratejik uyumunu gösterir."},
            {"name": "Risk Kaydı",               "description": "Tanımlanmış riskler, olasılık/etki matrisi ve yanıtlar."},
            {"name": "Sorun Kaydı",              "description": "Açık sorunlar, sahipler ve çözüm durumu."},
            {"name": "Kalite Kaydı",             "description": "Kalite inceleme ve test sonuçlarının özeti."},
            {"name": "Aşama Sonu Raporu",        "description": "Her aşama kapanışında hazırlanan ilerleme özeti."},
            {"name": "Proje Kapanış Raporu",     "description": "Ders çıkarılanlar, faydaların gerçekleşmesi ve kapanış onayı."},
        ],
        "default_workflow": {
            "mode": "sequential-locked",
            "nodes": [
                {"id": "nd_p2stup0001", "name": "Projeyi Başlat (SU)",
                 "description": "Proje yetkilendirilmesi için zemin hazırlanır: proje özeti, IS/PB atama ve yönetim yaklaşımı.",
                 "x": 60,  "y": 120, "color": "status-todo",     "is_initial": True,  "is_final": False},
                {"id": "nd_p2init0001", "name": "Projeyi Başlangıçlandır (IP)",
                 "description": "Proje Belgesi (PID) oluşturulur: iş vakası, risk kaydı, iletişim planı, kalite yönetim yaklaşımı.",
                 "x": 280, "y": 120, "color": "status-todo",     "is_initial": False, "is_final": False},
                {"id": "nd_p2dirp0001", "name": "Projeyi Yönet (DP)",
                 "description": "Proje Kurulu yetkiler, denetler ve kılavuzlar. Her aşama geçişinde Proje Kurulu devrede.",
                 "x": 500, "y": 60,  "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_p2ctrl0001", "name": "Aşamayı Kontrol Et (CS)",
                 "description": "Proje Yöneticisi iş paketleri atar, ilerlemeyi izler, değişiklikleri değerlendirir.",
                 "x": 500, "y": 180, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_p2mprd0001", "name": "Ürün Teslimatını Yönet (MP)",
                 "description": "Ekip Yöneticisi iş paketini kabul eder, yürütür ve teslim eder. Kalite onayı yapılır.",
                 "x": 720, "y": 180, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_p2msbd0001", "name": "Aşama Sınırını Yönet (SB)",
                 "description": "Mevcut aşama raporu ve sonraki aşama planı hazırlanır; Proje Kurulu onayı istenir.",
                 "x": 720, "y": 60,  "color": "status-review",   "is_initial": False, "is_final": False},
                {"id": "nd_p2clos0001", "name": "Projeyi Kapat (CP)",
                 "description": "Ürünler teslim edilir, iş faydaları doğrulanır, deneyimler kaydedilir, proje onaylanarak kapatılır.",
                 "x": 940, "y": 120, "color": "status-done",     "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_p2_01", "source": "nd_p2stup0001", "target": "nd_p2init0001", "type": "flow",     "label": None,                    "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_02", "source": "nd_p2init0001", "target": "nd_p2dirp0001", "type": "flow",     "label": "PID onayı",             "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_03", "source": "nd_p2dirp0001", "target": "nd_p2ctrl0001", "type": "flow",     "label": "Aşama yetki belgesi",   "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_04", "source": "nd_p2ctrl0001", "target": "nd_p2mprd0001", "type": "flow",     "label": "İş paketi atama",       "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_05", "source": "nd_p2mprd0001", "target": "nd_p2ctrl0001", "type": "flow",     "label": "Ürün teslimi",          "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_06", "source": "nd_p2ctrl0001", "target": "nd_p2msbd0001", "type": "flow",     "label": "Aşama sonu",            "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_07", "source": "nd_p2msbd0001", "target": "nd_p2dirp0001", "type": "flow",     "label": "Sonraki aşama onayı",   "bidirectional": False, "is_all_gate": False},
                {"id": "e_p2_08", "source": "nd_p2msbd0001", "target": "nd_p2clos0001", "type": "flow",     "label": "Son aşama kapanışı",    "bidirectional": False, "is_all_gate": False},
                # Proje Kurulu denetimi her aşamada
                {"id": "e_p2_09", "source": "nd_p2dirp0001", "target": "nd_p2clos0001", "type": "flow",     "label": "Erken kapanış kararı",  "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_p2mgmt", "name": "Yönetim Süreçleri",  "color": "#0F172A", "children": ["nd_p2stup0001","nd_p2init0001","nd_p2dirp0001","nd_p2clos0001"]},
                {"id": "gr_p2del",  "name": "Teslimat Süreçleri", "color": "#1E40AF", "children": ["nd_p2ctrl0001","nd_p2mprd0001","nd_p2msbd0001"]},
            ],
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Zengin görev şablonları (her sektör/metodoloji için spesifik)
# ─────────────────────────────────────────────────────────────────────────────

SECTOR_TASK_TEMPLATES = {
    "FIN": [
        ("3D Secure Entegrasyonu", "Visa ve Mastercard 3D Secure 2.0 protokolü entegrasyonu. OTP doğrulama, challenge akışı ve frictionless akış senaryoları uygulanmalıdır. PCI-DSS A1.2 uyumluluğu zorunludur."),
        ("Ödeme Uzlaştırma Modülü", "Günlük toplu uzlaştırma işlemleri: banka extracto dosyalarının işlenmesi, fark raporlaması ve otomatik çözümleme algoritması."),
        ("Fraud Tespit Motoru", "Kural bazlı ve ML tabanlı hibrit fraud tespiti. Coğrafi anomali, velocity check ve device fingerprint kuralları tanımlanmalı."),
        ("Kart Tokenizasyon Servisi", "Birincil hesap numaralarının (PAN) kriptografik tokenlarla değiştirilmesi. HSM entegrasyonu ve token yaşam döngüsü yönetimi."),
        ("Ödeme Bildirimleri", "SMS, e-posta ve push notification kanalları üzerinden gerçek zamanlı işlem bildirimleri. Şablon motoru ve tercih yönetimi."),
        ("Muhasebe Entegrasyonu", "Ödeme işlemlerinin ERP muhasebe modülüne otomatik çift taraflı kayıt olarak gönderilmesi."),
    ],
    "EGOV": [
        ("Kimlik Doğrulama Entegrasyonu", "e-Devlet Kapısı ile OAuth2/SAML entegrasyonu; T.C. kimlik numarası bazlı tekil kullanıcı tanıma."),
        ("Kurum Veri Alışverişi API", "SOAP/REST tabanlı veri alışverişi; XML şema validasyonu, mesaj imzalama ve güvenli kanal kurulum dokümantasyonu."),
        ("Dijital İmza Altyapısı", "e-İmza ve mobil imza entegrasyonu; zaman damgalama ve arşivleme süreçleri."),
        ("Resmi Yazışma Modülü", "KEP (Kayıtlı Elektronik Posta) entegrasyonu, resmi yazı şablon yönetimi ve EBYS bağlantısı."),
        ("Belge Doğrulama Servisi", "QR kodlu resmi belgeler için doğrulama endpoint'i; sahtecilik kontrolü ve log kaydı."),
    ],
    "HIS": [
        ("Hasta Kayıt Yönetimi", "HL7 FHIR R4 uyumlu hasta demografik veri modeli. Patient, Encounter ve Observation kaynakları."),
        ("Klinik Karar Destek Sistemi", "Ilaç etkileşimi kontrolleri, alerji uyarıları ve kılavuz bazlı tedavi önerileri motoru."),
        ("Randevu Takvim Sistemi", "Hekim müsaitlik takibi, kaynak (muayene odası, cihaz) çakışma kontrolü ve otomatik hatırlatmalar."),
        ("Laboratuvar Sonuç Entegrasyonu", "LIS sisteminden HL7 mesajları ile otomatik sonuç aktarımı ve kritik değer uyarıları."),
        ("KVKK Uyumluluk Modülü", "Kişisel sağlık verisi erişim logu, rıza yönetimi formu ve veri silme talep akışı."),
        ("E-Reçete Entegrasyonu", "SGK ve Türkiye Eczacılar Birliği sistemleriyle e-reçete yaratma ve doğrulama API'si."),
    ],
    "AUTO": [
        ("HIL Test Senaryoları", "ISO 26262 ASIL-B gereksinimlerine göre yan çarpma, frenleme ve sensör arıza enjeksiyonu test senaryoları."),
        ("Otomatik Regresyon Paketi", "Her build'de 500+ otomatik test koşumu; CI/CD pipeline entegrasyonu ve coverage raporu."),
        ("ECU Yazılım Güncelleme Altyapısı", "OTA (Over-the-Air) güncelleme mekanizması; dijital imza doğrulama ve geri alma (rollback) prosedürü."),
        ("CAN Bus Protokol Testi", "Araç içi CAN mesajlarının parse edilmesi, zamanlama analizi ve hata çerçevesi (error frame) simülasyonu."),
        ("Fonksiyonel Güvenlik Analizi", "FMEA hazırlığı, güvenlik hedefleri tablosu ve HARA (Hazard Analysis and Risk Assessment) dokümanları."),
    ],
    "GAME": [
        ("Matchmaking Motoru", "ELO tabanlı beceri eşleştirme algoritması; bölgesel gecikme optimizasyonu ve parti oluşturma mantığı."),
        ("Liderlik Tablosu Servisi", "Gerçek zamanlı sıralama hesaplama; haftalık/aylık sezon sıfırlama ve ödül dağıtım akışı."),
        ("Başarı & Ödül Sistemi", "Koşul tabanlı başarı tetikleyicileri, XP hesaplama motoru ve ödül envanter entegrasyonu."),
        ("In-Game Ekonomi Yönetimi", "Sanal para birimi akışı, fiyatlandırma dengesi ve kötüye kullanım tespit kuralları."),
        ("Oturum Yönetimi & Anti-Cheat", "Oyun oturumu koordinasyonu, sunucu tarafı doğrulama ve hile tespit imzaları."),
        ("Analitik Veri Hattı", "Oyuncu davranış olaylarının Kafka'ya basılması, Spark işlemesi ve BI dashboard'a aktarımı."),
    ],
    "IOT": [
        ("MQTT Broker Altyapısı", "Eclipse Mosquitto cluster kurulumu; TLS mutual auth, QoS seviyeleri ve topic filtreleme politikaları."),
        ("Zaman Serisi Veritabanı", "InfluxDB veya TimescaleDB tasarımı; retention politikaları, sürekli sorgular ve downsampling stratejisi."),
        ("Eşik Alarm Yönetimi", "Dinamik eşik yapılandırması, eskalasyon zinciri ve alarm susturma (silence) mekanizması."),
        ("Anomali Tespit Modeli", "Isolation Forest ve LSTM tabanlı çok değişkenli anomali modeli; online öğrenme stratejisi."),
        ("Cihaz Sağlık Panosu", "Telemetri metrikleri, cihaz çevrimiçi/çevrimdışı durumu ve bakım takvimi görselleştirmesi."),
        ("OTA Güncelleme Kanalı", "IoT cihazları için güvenli firmware güncelleme; sürüm yönetimi ve güncelleme başarı izleme."),
    ],
    "BLC": [
        ("Akıllı Kontrat Geliştirme", "Solidity ile tedarik zinciri izleme kontratı; olay bazlı değişmez kayıt ve erişim kontrol katmanı."),
        ("Özel Blockchain Ağ Kurulumu", "Hyperledger Fabric veya Polygon Edge ağ mimarisi; validator node yönetimi ve konsensüs konfigürasyonu."),
        ("QR Ürün Provenance Takibi", "Ürün yaşam döngüsü QR bazlı izlenebilirlik; üretim → depo → dağıtım → tüketici kanıt zinciri."),
        ("Token ve NFT Yönetimi", "ERC-721/ERC-1155 token sözleşmeleri; cüzdan entegrasyonu ve gas optimizasyonu."),
        ("Uyum ve Denetim Kaydı", "Tüm tedarik zinciri hareketlerinin değiştirilemez blockchain kaydı; düzenleyici kurum raporu."),
    ],
    "EDU": [
        ("Video Ders Altyapısı", "HLS akışı, uyarlanabilir kalite (ABR) ve DRM koruması ile video CDN entegrasyonu."),
        ("Quiz Motoru", "Çoktan seçmeli, doğru-yanlış ve serbest yazı soru tipleri; anında geri bildirim ve açıklama sistemi."),
        ("İlerleme Takip Sistemi", "Öğrenci ilerleme analitiği, tamamlama yüzdesi ve öğrenme yolu kişiselleştirme motoru."),
        ("Canlı Oturum Modülü", "WebRTC tabanlı canlı sınıf; ekran paylaşımı, el kaldırma ve kayıt fonksiyonları."),
        ("Sertifika Üretimi", "Kurs tamamlama üzerine otomatik PDF sertifika oluşturma; QR doğrulama ve blockchain kaydı."),
        ("Forumlar & Topluluk", "Kurs bazlı tartışma forumu; moderasyon araçları ve içerik derecelendirme sistemi."),
    ],
    "CRM": [
        ("Satış Hunisi Yönetimi", "Olası müşteri yakalama formları, fırsat aşaması takibi ve tahmini kapanış tarihi hesaplaması."),
        ("E-posta Kampanya Motoru", "Segmentasyon bazlı kampanya planlama, gönderim sıralama ve açılma/tıklama istatistikleri."),
        ("Müşteri 360° Görünümü", "Tüm etkileşimlerin tek profil sayfasında toplanması; satın alma geçmişi ve NPS skoru."),
        ("Otomatik Görev Atama", "Kural motoru ile yeni taleplerin ilgili satış temsilcisine otomatik yönlendirilmesi."),
        ("Raporlama & BI", "Aylık pipeline değeri, dönüşüm oranı ve ortalama satış döngüsü raporları."),
    ],
    "TEL": [
        ("Abonelik Faturalama Motoru", "Kullanım bazlı (kullanım başına), sabit ve hibrit faturalama planları; promosyon ve iskonto kuralları."),
        ("Toplu Fatura Üretimi", "Ay sonu toplu işlem: 10M+ abonenin fatura hesabı, PDF üretimi ve dağıtım kuyruğu."),
        ("Ödeme Uzlaştırma", "Banka hesap ekstreleri ile gerçekleşen tahsilatların eşleştirilmesi; fark raporlama ve itiraz akışı."),
        ("OSS/BSS Entegrasyon Katmanı", "Ağ yönetim sistemi (OSS) ile müşteri sistemi (BSS) arası servis katalog senkronizasyonu."),
        ("Müşteri Self-Servis Portalı", "Fatura görüntüleme, kullanım analizi, tarife değişikliği ve ödeme yapma ekranları."),
    ],
    "ERP": [
        ("SAP RFC Entegrasyon Adaptörü", "SAP BAPI/RFC arayüzleri üzerinden malzeme, sipariş ve stok verisi senkronizasyonu."),
        ("Master Data Yönetim Katmanı", "Birden fazla sistemdeki müşteri, tedarikçi ve ürün ana verilerinin altın kayıt (golden record) yönetimi."),
        ("İş Akışı Otomasyon Motoru", "Onay zinciri, eskalasyon kuralları ve entegrasyon hatası yeniden deneme (retry) mekanizması."),
        ("Veri Kalitesi & Doğrulama", "ETL hattında veri kalitesi kontrolü; duplicate tespiti, eksik alan kuralları ve düzeltme akışı."),
    ],
    "BOT": [
        ("Dialog Yönetim Sistemi", "Çok turlu konuşma akışı, bağlam takibi ve dinamik yanıt üretimi için state machine tasarımı."),
        ("NLP Motoru Entegrasyonu", "Rasa veya Dialogflow CX ile intent sınıflandırma ve varlık çıkarma pipeline'ı."),
        ("WhatsApp Business API", "Meta Cloud API entegrasyonu; şablon mesaj gönderimi, oturum yönetimi ve medya desteği."),
        ("Canlı Temsilci Devir Akışı", "Bot düşük güven durumunda insan aracıya canlı diyalog geçişi; tam konuşma geçmişi aktarımı."),
        ("Analitik & Intent İyileştirme", "Düşük güven konuşmaların etiketlenmesi, annotation arayüzü ve model yeniden eğitim döngüsü."),
    ],
    "INS": [
        ("Poliçe Oluşturma Motoru", "Risk skorlama algoritmaları, ürün katalog yönetimi ve otomatik prim hesaplama motoru."),
        ("Hasar Tazminat Süreci", "Hasar beyanı alımı, eksper atama, ödeme onay zinciri ve müşteri bildirim akışları."),
        ("Aktüeryal Hesaplama Servisi", "Mortalite tabloları, hayatta kalma analizi ve portföy risk modelleme kütüphanesi."),
        ("Doküman Yönetim Sistemi", "Poliçe belgesi, hasar formu ve ekspertiz raporu şablon motoru ve arşivleme altyapısı."),
        ("Uyum & Raporlama", "Sigortacılık Genel Müdürlüğü düzenleyici raporları ve IFRS 17 muhasebe entegrasyonu."),
    ],
    "RAD1": [
        ("Prototip v1 — Temel Akışlar", "Kullanıcı kayıt, giriş ve ana sayfa ekranlarının clickable prototipi. Figma çıktısından koda."),
        ("Prototip v2 — Çekirdek Özellikler", "İlk JAD oturumundan gelen geri bildirimlerle revize edilmiş temel özellikler."),
        ("MVP Teslimatı", "Prototip turlarından çıkan öncelikli özelliklerle işlevsel MVP; canlı kullanıcı testi."),
        ("Geri Bildirim İşleme", "Gerçek kullanıcı testinden gelen bulgular; kritik sorunların bir sonraki turda çözülmesi."),
    ],
    "DEFAULT": [
        ("Kullanıcı Oturum Yönetimi", "JWT tabanlı kimlik doğrulama, oturum süre uzatma ve rol bazlı yetkilendirme."),
        ("API Geçidi & Rate Limiting", "Merkezi API yönetimi, istek sınırlama politikaları ve API key yaşam döngüsü."),
        ("Bildirim Servisi", "E-posta, SMS ve in-app bildirim kanalları; tercih yönetimi ve teslimat izleme."),
        ("Arama & Filtreleme", "Elasticsearch tabanlı tam metin arama, faceted filtreleme ve otomatik tamamlama."),
        ("Raporlama Dashboard'u", "Grafiksel KPI göstergeleri, excel dışa aktarma ve zamanlanmış rapor gönderimi."),
        ("Performans Optimizasyonu", "Veritabanı sorgu optimizasyonu, Redis önbellekleme stratejisi ve CDN yapılandırması."),
    ],
}

RICH_SUBTASK_TEMPLATES = {
    "Analiz":         "Gereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.",
    "Tasarım":        "Bileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.",
    "Geliştirme":     "TDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.",
    "Unit Test":      "Jest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.",
    "Entegrasyon":    "Serviser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.",
    "Code Review":    "En az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.",
    "Bug Fix":        "Açık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.",
    "Dokümantasyon":  "OpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.",
    "QA & Test":      "Manuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.",
    "Dağıtım":        "Staging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.",
}

RICH_COMMENTS = [
    "API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.",
    "Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.",
    "Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.",
    "PR #314 hazır, review için atadım.",
    "Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.",
    "Redis cache stratejisi güncellendi, hit rate %94'e çıktı.",
    "Security audit geçti, sadece 2 low-severity bulgu var.",
    "Staging'de çalışıyor, prod dağıtım için onay bekliyorum.",
    "Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.",
    "Bağımlılık kütüphanesi güncellendi; breaking change yok.",
    "Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.",
    "Hata raporunu ekledim, root cause bulundu ve düzeltildi.",
    "Sprint review'da demo yapıldı, ürün sahibi onayladı.",
    "Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.",
    "Feature flag açıldı, A/B test başladı.",
    "Mimari karar kaydı (ADR) Confluence'a eklendi.",
]

# ─────────────────────────────────────────────────────────────────────────────
# YARDIMCI FONKSİYONLAR
# ─────────────────────────────────────────────────────────────────────────────

def _rnd_date(start_days_ago=60, end_days_ago=0) -> datetime:
    days = random.randint(end_days_ago, start_days_ago)
    return datetime.now() - timedelta(days=days)


def _default_workflow_for_template_name(template_name: str, templates_by_name: dict) -> dict:
    """Şablon adından process_config.workflow oluştur."""
    tpl = templates_by_name.get(template_name.lower())
    if tpl and tpl.default_workflow:
        return copy.deepcopy(tpl.default_workflow)
    # Geri dönüş: düz Scrum şekli
    return {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_scinit0001", "name": "Başlatma", "x": 60,  "y": 120, "color": "status-todo", "is_initial": True},
            {"id": "nd_sccls00005","name": "Kapanış",  "x": 940, "y": 120, "color": "status-done", "is_final": True},
        ],
        "edges": [{"id": "e1", "source": "nd_scinit0001", "target": "nd_sccls00005", "type": "flow",
                   "label": None, "bidirectional": False, "is_all_gate": False}],
        "groups": [],
    }


# ─────────────────────────────────────────────────────────────────────────────
# ANA FONKSİYONLAR
# ─────────────────────────────────────────────────────────────────────────────

async def seed_extended_users(session: AsyncSession, roles_map: dict) -> dict:
    logger.info("EXTENDED SEEDER: Ek kullanıcılar oluşturuluyor (→ 100 toplam)")
    result = await session.execute(select(UserModel))
    users_map = {u.email: u for u in result.scalars().all()}

    for u_data in EXTRA_USERS_DATA:
        if u_data["email"] in users_map:
            continue
        role = roles_map.get(u_data["role"])
        if not role:
            continue
        user = UserModel(
            email=u_data["email"],
            password_hash=get_password_hash("123456"),
            full_name=u_data["full_name"],
            is_active=True,
            role_id=role.id,
            avatar=u_data.get("avatar"),
        )
        session.add(user)
        users_map[u_data["email"]] = user

    await session.flush()
    return users_map


async def seed_lifecycle_templates(session: AsyncSession) -> dict:
    """12 kapsamlı yaşam döngüsü şablonunu ekler (idempotent, ada göre)."""
    logger.info("EXTENDED SEEDER: Yaşam döngüsü şablonları oluşturuluyor")
    result = await session.execute(select(ProcessTemplateModel))
    existing = {t.name.lower(): t for t in result.scalars().all()}
    added = dict(existing)

    for tpl_data in LIFECYCLE_TEMPLATES:
        key = tpl_data["name"].lower()
        if key in existing:
            added[key] = existing[key]
            continue

        kwargs = {
            "name":             tpl_data["name"],
            "is_builtin":       tpl_data.get("is_builtin", True),
            "description":      tpl_data.get("description", ""),
            "columns":          tpl_data.get("columns", []),
            "recurring_tasks":  tpl_data.get("recurring_tasks", []),
            "behavioral_flags": tpl_data.get("behavioral_flags", {}),
            "cycle_label_tr":   tpl_data.get("cycle_label_tr", "Faz"),
            "cycle_label_en":   tpl_data.get("cycle_label_en", "Phase"),
            "default_workflow": tpl_data.get("default_workflow", {}),
        }
        # İsteğe bağlı alanlar (ProcessTemplateModel'de varsa)
        for opt in ("default_artifacts", "default_phase_criteria"):
            if opt in tpl_data:
                kwargs[opt] = tpl_data[opt]

        tpl_obj = ProcessTemplateModel(**kwargs)
        session.add(tpl_obj)
        added[key] = tpl_obj

    await session.flush()
    return added


async def seed_extra_projects(session: AsyncSession, users_map: dict, templates_by_name: dict) -> list:
    """15 yeni projeyi ekler; her birine uygun şablon ve workflow bağlar."""
    logger.info("EXTENDED SEEDER: Ek projeler oluşturuluyor")
    result = await session.execute(select(ProjectModel))
    existing_keys = {p.key for p in result.scalars().all()}
    all_users = list(users_map.values())
    created = []

    for p_data in EXTRA_PROJECTS_DATA:
        if p_data["key"] in existing_keys:
            continue

        manager = users_map.get(p_data["manager_email"])
        tpl_name = p_data.get("template_name", "")
        tpl_obj  = templates_by_name.get(tpl_name.lower())

        project = ProjectModel(
            name=p_data["name"],
            key=p_data["key"],
            description=p_data["description"],
            methodology=p_data["methodology"],
            manager_id=manager.id if manager else None,
            start_date=date.today() - timedelta(days=random.randint(20, 60)),
            end_date=date.today()   + timedelta(days=random.randint(60, 180)),
        )
        project.status = ProjectStatus(p_data.get("status", "ACTIVE"))
        project.process_config = {
            "schema_version": 1,
            "workflow": _default_workflow_for_template_name(tpl_name, templates_by_name),
        }

        # 6–12 rastgele üye
        k = min(len(all_users), random.randint(6, 12))
        members = random.sample(all_users, k=k)
        if manager and manager not in members:
            members.append(manager)
        project.members.extend(members)

        session.add(project)
        existing_keys.add(p_data["key"])
        created.append(project)
        await session.flush()

        if tpl_obj:
            project.process_template_id = tpl_obj.id

        # Etiketler
        for lbl in p_data.get("labels", []):
            color = f"#{random.randint(0, 0xFFFFFF):06x}"
            session.add(LabelModel(project_id=project.id, name=lbl, color=color))

    await session.flush()
    return created


async def _seed_project_board(session: AsyncSession, project: ProjectModel, methodology: Methodology):
    """Proje için kolon + sprint + görev üretir; metodoloji bazlı taslak."""
    col_defs: list[tuple]
    sprints: list = []

    if methodology == Methodology.SCRUM:
        col_defs = [("Backlog", 0), ("To Do", 0), ("In Progress", 0), ("Code Review", 0), ("Done", 0)]
        await session.refresh(project, attribute_names=["members"])
        col_map = {}
        for idx, (name, wip) in enumerate(col_defs):
            c = BoardColumnModel(project_id=project.id, name=name, order_index=idx, wip_limit=wip or None)
            session.add(c)
            col_map[name] = c
        await session.flush()

        today = date.today()
        s1 = SprintModel(project_id=project.id, name="Sprint 1", goal="Altyapı ve temel akışlar",
                         start_date=today - timedelta(days=28), end_date=today - timedelta(days=14), is_active=False)
        s2 = SprintModel(project_id=project.id, name="Sprint 2", goal="Çekirdek özellikler",
                         start_date=today - timedelta(days=14), end_date=today, is_active=False)
        s3 = SprintModel(project_id=project.id, name="Sprint 3", goal="Entegrasyon & test",
                         start_date=today, end_date=today + timedelta(days=14), is_active=True)
        session.add_all([s1, s2, s3])
        await session.flush()
        sprints = [s1, s2, s3]

    elif methodology == Methodology.KANBAN:
        col_defs = [("Backlog", 0), ("Analiz", 3), ("Geliştirme", 4), ("Test", 2), ("Done", 0)]
        col_map = {}
        for idx, (name, wip) in enumerate(col_defs):
            c = BoardColumnModel(project_id=project.id, name=name, order_index=idx, wip_limit=wip or None)
            session.add(c)
            col_map[name] = c
        await session.flush()

    elif methodology == Methodology.WATERFALL:
        col_defs = [("Gereksinim", 0), ("Analiz", 0), ("Tasarım", 0), ("Uygulama", 0), ("Test", 0), ("Bakım", 0)]
        col_map = {}
        for idx, (name, wip) in enumerate(col_defs):
            c = BoardColumnModel(project_id=project.id, name=name, order_index=idx)
            session.add(c)
            col_map[name] = c
        await session.flush()

    else:  # ITERATIVE
        col_defs = [("Planlama", 0), ("Tasarım", 0), ("Uygulama", 0), ("Test", 0), ("Done", 0)]
        col_map = {}
        for idx, (name, wip) in enumerate(col_defs):
            c = BoardColumnModel(project_id=project.id, name=name, order_index=idx)
            session.add(c)
            col_map[name] = c
        await session.flush()

    await _generate_rich_tasks(session, project, sprints, col_map)


async def _generate_rich_tasks(
    session: AsyncSession,
    project: ProjectModel,
    sprints: list,
    col_map: dict,
):
    """Projeye özgü sektör şablonlarına dayalı zengin görev hiyerarşisi üretir."""
    await session.refresh(project, attribute_names=["members"])
    members = project.members
    if not members:
        return

    lbl_res = await session.execute(select(LabelModel).where(LabelModel.project_id == project.id))
    labels = lbl_res.scalars().all()
    col_names = list(col_map.keys())

    task_tmpl = SECTOR_TASK_TEMPLATES.get(project.key, SECTOR_TASK_TEMPLATES["DEFAULT"])

    for i, (p_title, p_desc) in enumerate(task_tmpl):
        p_col_name = col_names[min(i % 3, len(col_names) - 1)]
        p_col = col_map[p_col_name]
        p_assignee = random.choice(members)
        p_sprint = random.choice(sprints) if sprints else None
        created_at = _rnd_date(start_days_ago=50, end_days_ago=20)

        parent = TaskModel(
            project_id=project.id,
            sprint_id=p_sprint.id if p_sprint else None,
            column_id=p_col.id,
            assignee_id=p_assignee.id,
            reporter_id=project.manager_id,
            title=f"{p_title} [{project.key}-{i+1}]",
            description=(
                f"## Genel Bakış\n{p_desc}\n\n"
                f"## Kabul Kriterleri\n"
                f"- [ ] Tüm birim testleri geçiyor\n"
                f"- [ ] Entegrasyon testleri onaylandı\n"
                f"- [ ] Kod incelemesi tamamlandı\n"
                f"- [ ] Performans kriterleri karşılanıyor\n\n"
                f"## Bağımlılıklar\n"
                f"Bu görev tamamlanmadan ilgili servisler entegre edilemez."
            ),
            priority=random.choice([TaskPriority.HIGH, TaskPriority.CRITICAL]),
            points=random.choice([13, 21, 34]),
            due_date=datetime.now() + timedelta(days=random.randint(14, 45)),
            created_at=created_at,
        )
        session.add(parent)
        await session.flush()

        # Audit: görev oluşturma
        session.add(AuditLogModel(
            entity_type="task", entity_id=parent.id,
            field_name="status", old_value=None, new_value="Open",
            user_id=parent.reporter_id, action="created",
            timestamp=created_at,
        ))

        # Alt görevler (3–6 adet)
        subtask_keys = random.sample(list(RICH_SUBTASK_TEMPLATES.keys()),
                                     k=random.randint(3, min(6, len(RICH_SUBTASK_TEMPLATES))))
        for j, sk in enumerate(subtask_keys):
            s_col_name = random.choice(col_names)
            s_col = col_map[s_col_name]
            s_assignee = random.choice(members)
            s_sprint = p_sprint if p_sprint else (random.choice(sprints) if sprints else None)
            s_created = _rnd_date(start_days_ago=19, end_days_ago=3)

            sub = TaskModel(
                project_id=project.id,
                sprint_id=s_sprint.id if s_sprint else None,
                column_id=s_col.id,
                assignee_id=s_assignee.id,
                reporter_id=p_assignee.id,
                parent_task_id=parent.id,
                title=f"{sk}: {p_title} — Adım {j+1}",
                description=(
                    f"### İş Tanımı\n"
                    f"{RICH_SUBTASK_TEMPLATES[sk]}\n\n"
                    f"**Üst görev:** {parent.title}\n\n"
                    f"### Notlar\n"
                    f"- Önce tasarımı gözden geçirin\n"
                    f"- PR açmadan önce testlerin geçtiğini doğrulayın\n"
                    f"- Kapanışta Jira/Linear bağlantısını güncelleyin"
                ),
                priority=random.choice(list(TaskPriority)),
                points=random.choice([1, 2, 3, 5, 8]),
                due_date=datetime.now() + timedelta(days=random.randint(-3, 20)),
                created_at=s_created,
            )
            session.add(sub)
            await session.flush()

            # Audit: oluşturma
            session.add(AuditLogModel(
                entity_type="task", entity_id=sub.id,
                field_name="status", old_value=None, new_value="Open",
                user_id=sub.reporter_id, action="created",
                timestamp=s_created,
            ))

            # Audit: durum geçişi (eğer ilerlediyse)
            if s_col_name not in ("Backlog", "To Do", "Planlama", "Gereksinim"):
                changed_at = s_created + timedelta(days=random.randint(1, 5))
                session.add(AuditLogModel(
                    entity_type="task", entity_id=sub.id,
                    field_name="column_id", old_value="To Do", new_value=s_col_name,
                    user_id=sub.assignee_id, action="updated",
                    timestamp=changed_at,
                    extra_metadata={"phase_transition": True, "sprint": s_sprint.name if s_sprint else None},
                ))
                # Atama audit logu
                session.add(AuditLogModel(
                    entity_type="task", entity_id=sub.id,
                    field_name="assignee_id", old_value=None, new_value=str(sub.assignee_id),
                    user_id=project.manager_id, action="updated",
                    timestamp=s_created + timedelta(minutes=random.randint(5, 60)),
                ))

            # Audit: tamamlandıysa puan logu
            if s_col_name in ("Done", "Tamamlandı", "Bakım"):
                session.add(AuditLogModel(
                    entity_type="task", entity_id=sub.id,
                    field_name="status", old_value=s_col_name, new_value="Done",
                    user_id=sub.assignee_id, action="completed",
                    timestamp=s_created + timedelta(days=random.randint(5, 15)),
                ))

            # Yorum (%60 ihtimal)
            if random.random() < 0.6:
                session.add(CommentModel(
                    task_id=sub.id,
                    user_id=random.choice(members).id,
                    content=random.choice(RICH_COMMENTS),
                    created_at=s_created + timedelta(hours=random.randint(1, 48)),
                ))

            # İkinci yorum (%30 ihtimal)
            if random.random() < 0.3:
                session.add(CommentModel(
                    task_id=sub.id,
                    user_id=random.choice(members).id,
                    content=random.choice(RICH_COMMENTS),
                    created_at=s_created + timedelta(hours=random.randint(50, 100)),
                ))

            # Bildirim
            if sub.assignee_id:
                session.add(NotificationModel(
                    user_id=sub.assignee_id,
                    type=NotificationType.TASK_ASSIGNED,
                    message=f"Yeni görev atandı: {sub.title}",
                    related_entity_id=sub.id,
                    is_read=random.random() > 0.5,
                ))


async def _seed_teams_for_extra_projects(session: AsyncSession, created_projects: list, users_map: dict):
    all_users = list(users_map.values())
    for project in created_projects:
        owner = next((u for u in all_users if u.id == project.manager_id), all_users[0])
        team = TeamModel(
            name=f"{project.name} Ekibi",
            description=f"{project.name} projesi için oluşturulan çalışma ekibi.",
            owner_id=owner.id,
        )
        session.add(team)
        await session.flush()
        team.leader_id = owner.id

        await session.refresh(project, attribute_names=["members"])
        project_members = project.members or []
        for user in project_members[:8]:
            session.add(TeamMemberModel(team_id=team.id, user_id=user.id))
        session.add(TeamProjectModel(team_id=team.id, project_id=project.id))

    await session.flush()


async def _seed_milestones_artifacts(session: AsyncSession, created_projects: list):
    today = date.today()
    MILESTONE_SETS = [
        [
            {"name": "Faz 1 — Altyapı Hazır",       "status": "completed",   "days": -45},
            {"name": "Faz 2 — MVP Teslimatı",        "status": "in_progress", "days":  30},
            {"name": "Faz 3 — Üretim Lansmanı",      "status": "pending",     "days":  90},
        ],
        [
            {"name": "Sprint 1-3 Tamamlandı",        "status": "completed",   "days": -30},
            {"name": "Beta Sürüm",                   "status": "in_progress", "days":  20},
            {"name": "Genel Erişim (GA)",             "status": "pending",     "days":  75},
        ],
        [
            {"name": "Gereksinim Onayı",             "status": "completed",   "days": -60},
            {"name": "Tasarım Tamamlandı",           "status": "completed",   "days": -20},
            {"name": "Entegrasyon Testi Başlangıcı", "status": "in_progress", "days":  15},
            {"name": "Kabul Testi & Teslimat",       "status": "pending",     "days":  60},
        ],
    ]
    ARTIFACT_SETS = [
        [
            {"name": "Gereksinim Dokümanı (SRS)",    "status": "completed"},
            {"name": "Mimari Tasarım Dokümanı",      "status": "in_progress"},
            {"name": "Test Planı",                   "status": "in_progress"},
            {"name": "Kullanıcı Kılavuzu",           "status": "not_created"},
        ],
        [
            {"name": "API Spesifikasyonu (OpenAPI)", "status": "completed"},
            {"name": "Veri Akışı Diyagramı",        "status": "completed"},
            {"name": "Güvenlik Değerlendirmesi",     "status": "in_progress"},
            {"name": "Dağıtım Kılavuzu",             "status": "not_created"},
        ],
        [
            {"name": "İş Vakası Belgesi",            "status": "completed"},
            {"name": "Risk Kaydı",                   "status": "in_progress"},
            {"name": "Kabul Test Raporu",            "status": "not_created"},
        ],
    ]

    for i, project in enumerate(created_projects):
        ms_set = MILESTONE_SETS[i % len(MILESTONE_SETS)]
        for ms_data in ms_set:
            target_dt = datetime.combine(
                today + timedelta(days=ms_data["days"]), datetime.min.time()
            )
            session.add(MilestoneModel(
                project_id=project.id,
                name=ms_data["name"],
                status=ms_data["status"],
                target_date=target_dt,
            ))

        art_set = ARTIFACT_SETS[i % len(ARTIFACT_SETS)]
        for art_data in art_set:
            session.add(ArtifactModel(
                project_id=project.id,
                name=art_data["name"],
                status=art_data["status"],
            ))

    await session.flush()


# ─────────────────────────────────────────────────────────────────────────────
# GİRİŞ NOKTASI — seeder.py'den çağrılır
# ─────────────────────────────────────────────────────────────────────────────

async def seed_extended_data(session: AsyncSession):
    """Ana genişletilmiş seeder; seeder.py::seed_data() tarafından çağrılır."""
    try:
        logger.info("EXTENDED SEEDER: Başlatılıyor...")

        # Roller & kullanıcılar (mevcut map'i al)
        result = await session.execute(select(RoleModel))
        roles_map = {r.name: r for r in result.scalars().all()}

        users_map = await seed_extended_users(session, roles_map)

        # Şablonlar
        templates_by_name = await seed_lifecycle_templates(session)

        # Yeni projeler
        created_projects = await seed_extra_projects(session, users_map, templates_by_name)

        # Her yeni proje için board + görevler
        for project in created_projects:
            await _seed_project_board(session, project, project.methodology)

        # Ekipler
        if created_projects:
            await _seed_teams_for_extra_projects(session, created_projects, users_map)
            await _seed_milestones_artifacts(session, created_projects)

        await session.flush()
        logger.info(f"EXTENDED SEEDER: Tamamlandı — {len(created_projects)} yeni proje, "
                    f"{len(LIFECYCLE_TEMPLATES)} şablon, "
                    f"{len(EXTRA_USERS_DATA)} ek kullanıcı.")

    except Exception as exc:
        logger.error(f"EXTENDED SEEDER HATASI: {exc}")
        raise  # rollback ana seeder tarafından yapılır

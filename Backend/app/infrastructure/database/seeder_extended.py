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
from app.infrastructure.database._template_workflows import CANONICAL_TEMPLATES
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
        "template_name": "V-Modeli",
    },
    {
        "name": "Telekom Fatura Yönetimi",
        "key": "TEL",
        "description": "Abonelik bazlı faturalama, toplu fatura işleme ve ödeme uzlaştırma modüllerini kapsayan OSS/BSS sistemi.",
        "methodology": Methodology.WATERFALL,
        "status": "ON_HOLD",
        "manager_email": "merve.ozturk@firma.com",
        "labels": ["Billing", "OSS", "BSS", "Batch", "Reconciliation"],
        "template_name": "Waterfall",
    },
    {
        "name": "Oyun Backend Servisleri",
        "key": "GAME",
        "description": "Liderlik tablosu, başarı sistemi, anlık matchmaking ve in-game ekonomi servisleri. 1M+ eşzamanlı kullanıcı hedefli yatay ölçeklenebilir mimari.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",
        "manager_email": "huseyin.kurt@firma.com",
        "labels": ["Realtime", "Matchmaking", "Leaderboard", "Redis", "Scalability"],
        "template_name": "Scrum",
    },
    {
        "name": "IoT Sensör İzleme Platformu",
        "key": "IOT",
        "description": "Endüstriyel IoT sensörlerinden gelen telemetri verilerinin toplanması, eşik alarm yönetimi ve makine öğrenmesi tabanlı anomali tespiti.",
        "methodology": Methodology.KANBAN,
        "status": "ACTIVE",
        "manager_email": "selin.yilmaz@firma.com",
        "labels": ["MQTT", "TimeSeries", "Anomaly", "Dashboard", "ML"],
        "template_name": "Kanban",
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
        "template_name": "Yinelemeli Model",
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

# Kanonik 9 SDLC şablonu tek kaynaktan gelir (_template_workflows.py).
# Eski 12'li liste kaldırıldı; ad eşleşmesi için alias korunuyor.
LIFECYCLE_TEMPLATES = CANONICAL_TEMPLATES

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
    """Şablon adından process_config.phase_workflow oluştur (C1: V2 schema).

    Returns the raw `default_workflow` shape from the template; the caller is
    responsible for stamping it under `process_config["phase_workflow"]` with
    `schema_version=2`. The entity normalizer will inject a default
    `capabilities` block on first load if absent.
    """
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
    """Kanonik 9 SDLC şablonunu ekler (idempotent, ada göre)."""
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
        # C1 (workflow engine refactor): V2 schema — key is `phase_workflow`
        # (was `workflow`). Entity normalizer attaches a default `capabilities`
        # block on first load if absent.
        project.process_config = {
            "schema_version": 2,
            "phase_workflow": _default_workflow_for_template_name(tpl_name, templates_by_name),
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


async def _seed_project_board(session: AsyncSession, project: ProjectModel, methodology: Methodology, *, skip_tasks: bool = False):
    """Proje için kolon + sprint + görev üretir; metodoloji bazlı taslak.

    Kolon şekilleri (category / is_initial / is_terminal / entry_policy /
    exit_policy dahil) _default_columns.py'den okunur — single-source of
    truth ile alembic 014 + seed_X_details ile aynı spec'i paylaşır. Bu
    olmadan tüm kolonlar category='todo' olarak DB'ye düşüp CFD'nin done
    bucket'ını sıfırlatıyordu.
    """
    from app.infrastructure.database._default_columns import (
        SCRUM_DEFAULT_COLUMNS,
        KANBAN_DEFAULT_COLUMNS,
        WATERFALL_DEFAULT_COLUMNS,
        ITERATIVE_DEFAULT_COLUMNS,
    )

    sprints: list = []

    if methodology == Methodology.SCRUM:
        await session.refresh(project, attribute_names=["members"])
        col_specs = SCRUM_DEFAULT_COLUMNS
    elif methodology == Methodology.KANBAN:
        col_specs = KANBAN_DEFAULT_COLUMNS
    elif methodology == Methodology.WATERFALL:
        col_specs = WATERFALL_DEFAULT_COLUMNS
    else:  # ITERATIVE
        col_specs = ITERATIVE_DEFAULT_COLUMNS

    col_map: dict = {}
    for spec in col_specs:
        c = BoardColumnModel(
            project_id=project.id,
            name=spec["name"],
            order_index=spec["order_index"],
            wip_limit=spec.get("wip_limit", 0) or None,
            category=spec.get("category"),
            is_initial=spec.get("is_initial", False),
            is_terminal=spec.get("is_terminal", False),
            max_duration_days=spec.get("max_duration_days"),
            entry_policy=spec.get("entry_policy", "any"),
            exit_policy=spec.get("exit_policy", "any"),
        )
        session.add(c)
        col_map[spec["name"]] = c
    await session.flush()

    if methodology == Methodology.SCRUM:
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

    # Simulator bootstrap (skip_tasks=True) leaves task generation to the
    # discrete-event run. Lifespan path keeps the legacy fixture behaviour.
    if not skip_tasks:
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

async def seed_extended_data(session: AsyncSession, *, skip_tasks: bool = False):
    """Ana genişletilmiş seeder; seeder.py::seed_data() tarafından çağrılır.

    ``skip_tasks=True`` is the simulator bootstrap mode — base entities are
    created but no synthetic tasks. The simulator drives task generation on
    top of this baseline so audit_log rows carry simulated timestamps.
    """
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

        # Her yeni proje için board + görevler (görevler skip_tasks ile bypass'lanabilir)
        for project in created_projects:
            await _seed_project_board(session, project, project.methodology, skip_tasks=skip_tasks)

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

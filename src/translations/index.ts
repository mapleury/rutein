export type Language = 'ID' | 'EN';

export const translations = {
  ID: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.map': 'Peta',
    'nav.routes': 'Rute',
    'nav.schedule': 'Jadwal',
    'nav.budget': 'Anggaran',
    'nav.disruptions': 'Peringatan',
    'nav.ask_ai': 'Tanya AI',
    'nav.settings': 'Pengaturan',
    'nav.profile': 'Profil',
    'nav.logout': 'Keluar',
    'nav.saved_places': 'Tempat Tersimpan',

    // Map & Sidebar
    'sidebar.operators': 'Operator Transportasi',
    'sidebar.show_all': 'Tampilkan Semua',
    'sidebar.saved_places': 'Tempat Tersimpan',
    'sidebar.loading_saved': 'Memuat tempat tersimpan...',
    'sidebar.no_saved': 'Belum ada tempat tersimpan.',
    'sidebar.view_profile': 'Lihat Profil',

    // Map Search & Controls
    'controls.confused_mode': 'Mode Bingung',
    'controls.map_style': 'Gaya Peta',
    'controls.my_location': 'Lokasi Saat Ini',
    'controls.saved_places': 'Tempat Tersimpan',
    'controls.disruptions': 'Info Gangguan',
    'search.placeholder': 'Cari lokasi atau tujuan...',
    'search.route_btn': 'Rute',
    'search.origin': 'Lokasi Awal',
    'search.destination': 'Lokasi Tujuan',
    'search.add_stop': 'Tambah Hentian',
    'search.calculate_route': 'Hitung Rute',
    'search.clear': 'Hapus',
    'search.my_location': 'Lokasi Saya',
    'search.searching': 'Mencari...',

    // Route Detail Bar
    'detail_bar.efficient': 'Efisien',
    'detail_bar.cheapest': 'Termurah',
    'detail_bar.hurry': 'Tercepat',
    'detail_bar.step_by_step': 'Langkah-langkah Rute',
    'detail_bar.duration': 'Durasi',
    'detail_bar.cost': 'Biaya',
    'detail_bar.transfers': 'Transit',
    'detail_bar.show_details': 'Lihat Detail Rute',
    'detail_bar.hide_details': 'Sembunyikan Detail',
    'detail_bar.next': 'Lanjut',
    'detail_bar.back': 'Kembali',
    'detail_bar.from': 'Dari',
    'detail_bar.to': 'Ke',

    // Transport Types
    'transport.transjakarta': 'TransJakarta',
    'transport.bus': 'Bus / BRT',
    'transport.krl': 'KRL Commuter Line',
    'transport.mrt': 'MRT Jakarta',
    'transport.lrt': 'LRT Jabodebek / Jakarta',
    'transport.intercity_train': 'Kereta Antarkota',
    'transport.airport_rail': 'Kereta Bandara',
    'transport.ferry': 'Kapal Penyeberangan',

    // Confused Mode (Tanya AI)
    'ai.title': 'Asisten AI Navigasi Rutein',
    'ai.status_active': 'AI RUTEIN Aktif',
    'ai.new_chat': 'Chat Baru',
    'ai.history_title': 'Riwayat Percakapan',
    'ai.no_history': 'Belum ada riwayat percakapan.',
    'ai.clear_history': 'Hapus Semua Riwayat',
    'ai.welcome_title': 'Butuh bantuan memilih rute?',
    'ai.welcome_desc': 'Cukup tanyakan lokasi tempat tujuanmu, atau pilih pertanyaan cepat di bawah. RUTEIN akan menganalisis posisi GPS kamu, halte/stasiun terdekat, tarif, serta preferensi transit secara otomatis.',
    'ai.quick_questions_title': 'Pilih Pertanyaan Cepat:',
    'ai.gps_detecting': 'Mendeteksi GPS...',
    'ai.gps_connected': 'GPS Terkini Terhubung',
    'ai.gps_unavailable': 'GPS Tidak Tersedia',
    'ai.input_placeholder': 'Tanyakan rute, tarif, atau stasiun terdekat...',

    // Quick Actions
    'quick.where_am_i': 'Saya ada di mana sekarang?',
    'quick.home_route': 'Bagaimana cara pulang ke Rumah?',
    'quick.office_route': 'Rute terbaik ke Kantor / Sekolah',
    'quick.fastest_route': 'Cari rute paling cepat',
    'quick.cheapest_route': 'Cari rute paling hemat',

    // Landing Page
    'landing.hero_title': 'Navigasi Multi-Moda Cerdas untuk Perjalananmu',
    'landing.hero_subtitle': 'Rutein menggabungkan KRL, MRT, TransJakarta, Bus, dan Jalan Kaki dalam satu solusi rute paling efisien, hemat, dan cepat di Indonesia.',
    'landing.start_btn': 'Mulai Cari Rute',
    'landing.confused_btn': 'Tanya AI Rutein',
    'landing.feature_comparison': 'Perbandingan Rute Real-time',
    'landing.feature_comparison_desc': 'Bandingkan durasi, estimasi biaya, dan jumlah transit antar moda dalam satu tampilan terpadu.',
    'landing.feature_disruptions': 'Peringatan Gangguan Lalu Lintas',
    'landing.feature_disruptions_desc': 'Dapatkan kabar kemacetan, perbaikan rel, atau penutupan jalan secara terpercaya.',
    'landing.feature_budget': 'Perencanaan Anggaran Bulanan',
    'landing.feature_budget_desc': 'Hitung dan optimalkan pengeluaran ongkos transportasi harian serta bulanan kamu.',

    // Dashboard
    'dashboard.welcome': 'Selamat datang kembali',
    'dashboard.quick_access': 'Akses Cepat Perjalanan',
    'dashboard.active_alerts': 'Peringatan Lalu Lintas Terkini',
    'dashboard.recent_routes': 'Rute Terakhir',
    'dashboard.explore_map': 'Buka Dashboard Peta',

    // Common
    'common.loading': 'Memuat...',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.back': 'Kembali',
    'common.error': 'Terjadi kesalahan.',
  },
  EN: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.map': 'Map',
    'nav.routes': 'Routes',
    'nav.schedule': 'Schedule',
    'nav.budget': 'Budget',
    'nav.disruptions': 'Alerts',
    'nav.ask_ai': 'Ask AI',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Sign Out',
    'nav.saved_places': 'Saved Places',

    // Map & Sidebar
    'sidebar.operators': 'Transport Operators',
    'sidebar.show_all': 'Show All',
    'sidebar.saved_places': 'Saved Places',
    'sidebar.loading_saved': 'Loading saved places...',
    'sidebar.no_saved': 'No saved places found.',
    'sidebar.view_profile': 'View Profile',

    // Map Search & Controls
    'controls.confused_mode': 'Confused Mode',
    'controls.map_style': 'Map Style',
    'controls.my_location': 'My Location',
    'controls.saved_places': 'Saved Places',
    'controls.disruptions': 'Disruption Info',
    'search.placeholder': 'Search location or destination...',
    'search.route_btn': 'Route',
    'search.origin': 'Origin Location',
    'search.destination': 'Destination Location',
    'search.add_stop': 'Add Stop',
    'search.calculate_route': 'Calculate Route',
    'search.clear': 'Clear',
    'search.my_location': 'My Location',
    'search.searching': 'Searching...',

    // Route Detail Bar
    'detail_bar.efficient': 'Efficient',
    'detail_bar.cheapest': 'Cheapest',
    'detail_bar.hurry': 'Fastest',
    'detail_bar.step_by_step': 'Step-by-step directions',
    'detail_bar.duration': 'Duration',
    'detail_bar.cost': 'Cost',
    'detail_bar.transfers': 'Transfers',
    'detail_bar.show_details': 'View Route Details',
    'detail_bar.hide_details': 'Hide Details',
    'detail_bar.next': 'Next',
    'detail_bar.back': 'Back',
    'detail_bar.from': 'From',
    'detail_bar.to': 'To',

    // Transport Types
    'transport.transjakarta': 'TransJakarta',
    'transport.bus': 'Bus / BRT',
    'transport.krl': 'KRL Commuter Line',
    'transport.mrt': 'MRT Jakarta',
    'transport.lrt': 'LRT Jabodebek / Jakarta',
    'transport.intercity_train': 'Intercity Train',
    'transport.airport_rail': 'Airport Rail',
    'transport.ferry': 'Ferry / Boat',

    // Confused Mode (Tanya AI)
    'ai.title': 'Rutein AI Navigation Assistant',
    'ai.status_active': 'RUTEIN AI Active',
    'ai.new_chat': 'New Chat',
    'ai.history_title': 'Chat History',
    'ai.no_history': 'No chat history yet.',
    'ai.clear_history': 'Clear All History',
    'ai.welcome_title': 'Need help choosing a route?',
    'ai.welcome_desc': 'Simply ask for your destination, or pick a quick question below. RUTEIN will automatically analyze your GPS location, nearby stops, fares, and transit preferences.',
    'ai.quick_questions_title': 'Select a Quick Question:',
    'ai.gps_detecting': 'Detecting GPS...',
    'ai.gps_connected': 'Live GPS Connected',
    'ai.gps_unavailable': 'GPS Unavailable',
    'ai.input_placeholder': 'Ask about routes, fares, or nearby stations...',

    // Quick Actions
    'quick.where_am_i': 'Where am I right now?',
    'quick.home_route': 'How do I get back Home?',
    'quick.office_route': 'Best route to Office / School',
    'quick.fastest_route': 'Find the fastest route',
    'quick.cheapest_route': 'Find the cheapest route',

    // Landing Page
    'landing.hero_title': 'Smart Multi-Modal Navigation for Your Journey',
    'landing.hero_subtitle': 'Rutein seamlessly integrates KRL, MRT, TransJakarta, Bus, and Walking into a single most efficient, cost-effective, and fast route solution in Indonesia.',
    'landing.start_btn': 'Explore Routes',
    'landing.confused_btn': 'Ask Rutein AI',
    'landing.feature_comparison': 'Real-time Route Comparison',
    'landing.feature_comparison_desc': 'Compare duration, estimated fare, and transit transfers across modes in one unified view.',
    'landing.feature_disruptions': 'Traffic Disruption Alerts',
    'landing.feature_disruptions_desc': 'Get reliable updates on traffic jams, rail maintenance, or road closures.',
    'landing.feature_budget': 'Monthly Budget Planning',
    'landing.feature_budget_desc': 'Calculate and optimize your daily and monthly commuting expenses.',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.quick_access': 'Quick Transit Access',
    'dashboard.active_alerts': 'Recent Traffic Alerts',
    'dashboard.recent_routes': 'Recent Routes',
    'dashboard.explore_map': 'Open Map Dashboard',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.error': 'An error occurred.',
  },
} as const;

export type TranslationKey = keyof typeof translations.ID;

// Funciones pequeñas para leer y guardar datos locales del aplicativo.
const BancoStore = {
  getJSON(key, fallback = null){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(e) {
      return fallback;
    }
  },
  setJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key){
    localStorage.removeItem(key);
  },
  now(){
    return new Date().toISOString();
  }
};

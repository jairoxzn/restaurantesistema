const fs = require('fs');
const path = require('path');

const settingsFile = path.join(__dirname, '..', 'data', 'settings.json');

const getSettings = (req, res) => {
  try {
    if (!fs.existsSync(settingsFile)) {
      return res.json({
        nombre_cafeteria: "Cafetería Colca",
        logo_url: "",
        moneda: "S/",
        tema_color: "amber"
      });
    }
    const data = fs.readFileSync(settingsFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const updateSettings = (req, res) => {
  try {
    const { nombre_cafeteria, moneda, tema_color } = req.body;
    let { logo_url } = req.body;
    
    if (req.file) {
      logo_url = req.file.filename;
    }
    
    const newSettings = {
      nombre_cafeteria: nombre_cafeteria || "Cafetería Colca",
      logo_url: logo_url || "",
      moneda: moneda || "S/",
      tema_color: tema_color || "amber"
    };

    fs.writeFileSync(settingsFile, JSON.stringify(newSettings, null, 2));
    res.json({ message: 'Configuración actualizada', settings: newSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { getSettings, updateSettings };

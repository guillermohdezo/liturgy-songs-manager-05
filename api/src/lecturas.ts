import { load } from 'cheerio';

/**
 * Formatea una fecha a formato YYYY/MM/DD para la URL
 */
function formatDateForUrl(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Extrae las lecturas del HTML de la página
 */
function extractReadings(html: string) {
  const $ = load(html);
  
  let indicazioneLiturgica: string | null = null;
  let primeraLectura = {
    cita: null as string | null,
    lectura: null as string | null
  };
  
  let evangelio = {
    cita: null as string | null,
    lectura: null as string | null
  };

  // Buscar indicazioneLiturgica
  const indicacion = $('[class*="indicazioneLiturgica"], .indicazioneLiturgica');
  if (indicacion.length > 0) {
    indicazioneLiturgica = indicacion.eq(0).text().trim();
  }

  // Buscar la sección "Lectura del Día"
  $('section.section--evidence').each((i, element) => {
    const section = $(element);
    const title = section.find('h2').text().trim();
    
    if (title === 'Lectura del Día') {
      const paragraphs = section.find('p');
      if (paragraphs.length >= 2) {
        primeraLectura.cita = paragraphs.eq(1).text().trim();
        
        let lecturaTexto = '';
        for (let j = 2; j < paragraphs.length; j++) {
          const texto = $(paragraphs[j]).text().trim();
          if (texto.length > 0) {
            lecturaTexto += (lecturaTexto ? ' ' : '') + texto;
          }
        }
        primeraLectura.lectura = lecturaTexto;
      }
    } else if (title === 'Evangelio del Día') {
      const paragraphs = section.find('p');
      if (paragraphs.length >= 2) {
        evangelio.cita = paragraphs.eq(1).text().trim();
        
        let lecturaTexto = '';
        for (let j = 2; j < paragraphs.length; j++) {
          const texto = $(paragraphs[j]).text().trim();
          if (texto.length > 0) {
            lecturaTexto += (lecturaTexto ? ' ' : '') + texto;
          }
        }
        evangelio.lectura = lecturaTexto;
      }
    }
  });

  return {
    indicazioneLiturgica: indicazioneLiturgica,
    primeraLectura: primeraLectura,
    evangelio: evangelio
  };
}

/**
 * Obtiene las lecturas del día de Vatican News
 */
export async function getReadingsFromVatican(fecha: string) {
  try {
    const date = new Date(fecha);
    // Suma un día
    date.setDate(date.getDate() + 1);
    if (isNaN(date.getTime())) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    const urlDate = formatDateForUrl(date);
    const url = `https://www.vaticannews.va/es/evangelio-de-hoy/${urlDate}.html`;

    // Hacer la solicitud directamente desde el servidor (sin CORS issues)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener la página: ${response.status}`);
    }

    const html = await response.text();
    const readings = extractReadings(html);

    return {
      success: true,
      fecha: fecha,
      url: url,
      lecturas: {
        indicacionLiturgica: readings.indicazioneLiturgica,
        primeraLectura: readings.primeraLectura,
        evangelio: readings.evangelio
      }
    };
  } catch (error) {
    console.error('Error en getReadingsFromVatican:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      fecha: fecha
    };
  }
}

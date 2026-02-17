import mercadopago from "./mercadopago.png";
import bancoDeCordoba from "./banco-de-cordoba.png";
import bbvaFrances from "./bbva-frances.png";
import bancoGalicia from "./banco-galicia.png";
import bancoSantander from "./banco-santander.png";
import bancoNacion from "./banco-nacion.png";
import bancoProvincia from "./banco-provincia.png";
import hsbc from "./hsbc.png";
import bancoMacro from "./banco-macro.png";
import brubank from "./brubank.png";
import uala from "./uala.png";

const bankLogos: Record<string, string> = {
  "Mercadopago": mercadopago,
  "Banco de Cordoba": bancoDeCordoba,
  "BBVA Frances": bbvaFrances,
  "Banco Galicia": bancoGalicia,
  "Banco Santander": bancoSantander,
  "Banco Nacion": bancoNacion,
  "Banco Provincia": bancoProvincia,
  "HSBC": hsbc,
  "Banco Macro": bancoMacro,
  "Brubank": brubank,
  "Uala": uala,
};

export function getBankLogo(bankName: string): string | undefined {
  return bankLogos[bankName];
}

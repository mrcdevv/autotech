import mercadopago from "./mercadopago.svg";
import bancoDeCordoba from "./banco-de-cordoba.svg";
import bbvaFrances from "./bbva-frances.svg";
import bancoGalicia from "./banco-galicia.svg";
import bancoSantander from "./banco-santander.svg";
import bancoNacion from "./banco-nacion.svg";
import bancoProvincia from "./banco-provincia.svg";
import hsbc from "./hsbc.svg";
import bancoMacro from "./banco-macro.svg";
import brubank from "./brubank.svg";
import uala from "./uala.svg";

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

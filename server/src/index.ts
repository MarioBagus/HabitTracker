import app from "./app";
import { APP_TIMEZONE, todayISO } from "./lib/date";
import { getStorage } from "./storage";

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`✅ API berjalan di http://localhost:${port}/api`);
  console.log(`   Penyimpanan: ${getStorage().kind} | Zona waktu: ${APP_TIMEZONE} | Hari ini: ${todayISO()}`);
});

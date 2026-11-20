import { useState, type ReactNode } from 'react'
import { Card } from './Card'

const ITEMS: { id: string; n: number; t: string; sub: string; body: ReactNode }[] = [
  {
    id: 'd1', n: 1, t: 'Business Problem Statement', sub: 'ทำไมต้องวิเคราะห์ราคา PTTEP รายวัน',
    body: (
      <>
        <p className="lede">PTTEP มีความเสี่ยงทางธุรกิจหลายด้าน ทั้งปริมาณสำรองที่ลดลง ต้นทุนการผลิตที่สูงขึ้น และกระแส Net Zero แต่สิ่งเหล่านี้เป็นเรื่องระยะยาว สิ่งที่ทำให้ราคาหุ้นแกว่งทุกวันคือราคาน้ำมันโลก ซึ่งขึ้นกับ OPEC+ และภูมิรัฐศาสตร์ รวมถึงค่าเงินและดอกเบี้ย เพราะรายได้เป็นดอลลาร์ แต่หุ้นซื้อขายเป็นเงินบาทใน SET</p>
        <p>ตัวอย่างคือช่วงปลายปี 2022 ถึงกลางปี 2025 ราคาลงจาก 193.50 บาท (23 พ.ย. 2022) เหลือ 94.75 บาท (6 พ.ค. 2025) หรือ −51% ผู้จัดการพอร์ตจึงต้องรู้ทุกวันว่าปัจจัยไหนกำลังดึงราคา และราคาควรอยู่ที่เท่าไหร่ เพื่อปรับพอร์ตและลดความเสี่ยงได้ทัน</p>
        <dl className="triad">
          <div><dt>การบริหารพอร์ต</dt><dd>PTTEP มีน้ำหนักมากในพอร์ตหุ้นพลังงานและ SET50 การรู้ว่าวันนี้ปัจจัยไหนทำให้หุ้นขยับ ช่วยแยกได้ว่าเป็นแรงกระแทกทั้งกลุ่มที่ควรป้องกันความเสี่ยง หรือเป็นโอกาสเฉพาะตัวหุ้น</dd></div>
          <div><dt>การลดความเสี่ยง</dt><dd>ความผันผวนต่อปีประมาณ 27% และเคยลงจากจุดสูงสุด −51% ถ้ารู้ว่าน้ำมันลงแล้วราคาควรลงเท่าไหร่ ก็ตั้ง hedge หรือ stop-loss ได้ล่วงหน้า และสัญญาณเตือน Bear ช่วยลดสัดส่วนก่อนขาดทุนหนัก</dd></div>
          <div><dt>การสร้าง Alpha</dt><dd>Brent ขยับไปพร้อม PTTEP รายวันอย่างวัดได้ (correlation 0.30) สัญญาณจากปัจจัยและ regime ใช้หาจังหวะซื้อขาย หรือทำกลยุทธ์เทียบกับ SET ได้</dd></div>
        </dl>
      </>
    ),
  },
  {
    id: 'd2', n: 2, t: 'Financial Implications', sub: 'ปัจจัยแต่ละตัวส่งผลต่อตัวเลขการเงินอย่างไร',
    body: (
      <div className="tbl"><table>
        <thead><tr><th>ปัจจัยที่เปลี่ยน</th><th>กลไกการส่งผ่าน</th><th>ผลต่อ PTTEP</th></tr></thead>
        <tbody>
          <tr><td>Brent ขึ้น</td><td>ราคาขายน้ำมันสูงขึ้น ราคาก๊าซบางส่วนผูกกับน้ำมันแบบมีการหน่วงเวลา</td><td>รายได้และอัตรากำไร EBITDA เพิ่ม ประมาณการ EPS ถูกปรับขึ้น และ EV/EBITDA สูงขึ้น beta รายวันต่อ Brent ≈ 0.20</td></tr>
          <tr><td>USD/THB ขึ้น (บาทอ่อน)</td><td>รายได้ดอลลาร์แปลงเป็นบาทได้มากขึ้น</td><td>กำไรในรูปบาทและความสามารถจ่ายปันผลเพิ่ม ผลรายวันแทบเป็นศูนย์ ส่วนใหญ่เห็นผลตอนประกาศงบรายไตรมาส</td></tr>
          <tr><td>ผลตอบแทนพันธบัตรไทยขึ้น</td><td>อัตราไร้ความเสี่ยงสูงขึ้น ทำให้ต้นทุนส่วนผู้ถือหุ้นและ WACC สูงขึ้น</td><td>มูลค่าจาก DCF ลดลงและ P/E ถูกกดดัน ในโมเดล Dataiku พันธบัตร 1 ปีและ 10 ปีมีความสำคัญ 12% และ 11%</td></tr>
          <tr><td>SET Index ขึ้น</td><td>ความต้องการรับความเสี่ยงของตลาดและเงินทุนต่างชาติ</td><td>beta ต่อ SET ≈ 0.52 เป็นส่วนระดับตลาดที่อธิบายการขยับรายวันของ PTTEP ได้มากที่สุด</td></tr>
          <tr><td>S&amp;P 500 ขึ้น</td><td>อารมณ์ตลาดโลก (risk-on/risk-off)</td><td>ผลในวันเดียวกันน้อย (ρ ≈ 0.01) เพราะเวลาตลาดต่างกัน มีผลมากช่วงตลาดโลกเทขาย</td></tr>
          <tr><td>ความผันผวนสูงขึ้น</td><td>ราคาแกว่งกว้างขึ้น และ implied volatility สูงขึ้น</td><td>ส่วนชดเชยความเสี่ยงและ VaR สูงขึ้น ต้องลดขนาดการลงทุน ความผันผวน 20 วันล่าสุด 38% เทียบค่าเฉลี่ย 27%</td></tr>
        </tbody>
      </table></div>
    ),
  },
  {
    id: 'd3', n: 3, t: 'Feature Selection', sub: 'ปัจจัยรายวันที่เลือกใช้ แบ่ง 4 หมวด',
    body: (
      <>
        <div className="feature-grid">
          <div><h4>เศรษฐกิจมหภาค</h4><ul><li><code>FX_THB_per_USD</code> แปลงรายได้ดอลลาร์เป็นบาท</li><li><code>Thailand_10Y_Yield_Pct</code> ต้นทุนเงินทุนระยะยาว</li><li><code>Thailand_1Y_Yield_Pct</code> การคาดการณ์ดอกเบี้ยนโยบาย</li></ul></div>
          <div><h4>เฉพาะอุตสาหกรรม</h4><ul><li><code>Brent_Close</code> ปัจจัยหลักที่กำหนดรายได้ธุรกิจต้นน้ำ</li></ul></div>
          <div><h4>อารมณ์ตลาด</h4><ul><li><code>SET_Index</code> ความต้องการรับความเสี่ยงของตลาดไทย</li><li><code>SP500_Close</code> อารมณ์ตลาดโลก</li></ul></div>
          <div><h4>โมเมนตัมทางเทคนิค</h4><ul><li>SMA 50 วันของ <code>PTTEP_Close</code> ใช้กำหนด label</li><li><code>PTTEP_Close</code> ราคาปิด เป็นตัวแปรที่สำคัญที่สุดในโมเดล Dataiku (28%)</li></ul></div>
        </div>
        <p>correlation ของผลตอบแทนรายวันกับ PTTEP คือ Brent 0.30 และ SET 0.28 ส่วนค่าเงินบาทและ S&amp;P 500 ใกล้ 0 ถ้าดูที่ระดับราคาจะดูสัมพันธ์กันมากกว่า (0.82 กับพันธบัตร 10 ปี) แต่ส่วนใหญ่เกิดจากแนวโน้มร่วมกัน ทุกส่วนของหน้านี้จึงใช้ <em>การเปลี่ยนแปลง</em> ไม่ใช่ระดับราคา</p>
      </>
    ),
  },
  {
    id: 'd4', n: 4, t: 'Interactive Dashboard Prototype', sub: 'หน้านี้คือ dashboard',
    body: (
      <>
        <p>สร้างด้วย Vite, React, TypeScript, Three.js (React Three Fiber) และ uPlot แล้ว build เป็นไฟล์ HTML ไฟล์เดียวที่ฝังข้อมูล WS3 ไว้ ดับเบิลคลิกเปิดได้โดยไม่ต้องต่อเน็ต หรือรันบน localhost ด้วย <code>npm run dev</code></p>
        <ul className="ticks">
          <li><b>Market ridgeline 3 มิติ:</b> แถบแต่ละแถบคือเส้นทาง 120 วันของแต่ละปัจจัย แถบหน้าสุดคือ PTTEP สีตาม Bull/Bear และแถบยิ่งเข้มยิ่งสัมพันธ์กับ PTTEP มาก</li>
          <li><b>ราคาและ regime:</b> ราคาปิด, SMA50 และ label Bull/Bear จาก WS3 เลือกช่วง 3M ถึงทั้งหมด</li>
          <li><b>การ์ดปัจจัย:</b> กดเพื่อดูการเปลี่ยนแปลง 1 และ 20 วัน, correlation, beta และกราฟ 60 วัน</li>
          <li><b>สัญญาณ regime:</b> มาตรวัด P(Bear), ปรับเกณฑ์ได้ และ confusion matrix เปลี่ยนตามทันที</li>
          <li><b>อัปเดตรายวัน:</b> รัน notebook WS3 ใหม่ แล้วกด <em>โหลด CSV</em></li>
        </ul>
      </>
    ),
  },
  {
    id: 'd5', n: 5, t: 'Regime Classification', sub: 'แปลงผลทำนายเป็นสัญญาณ Bull / Bear',
    body: (
      <>
        <div className="steps">
          <div><span className="step">ขั้นที่ 1 · Label</span>
            <div className="formula">SMA<sub>50,t</sub> = (1/50) · Σ<sub>i=0..49</sub> P<sub>t−i</sub><br />Regime<sub>t</sub> = Bull ถ้า P<sub>t</sub> ≥ SMA<sub>50,t</sub> ไม่เช่นนั้นเป็น Bear</div></div>
          <div><span className="step">ขั้นที่ 2 · ทำนายความน่าจะเป็น</span>
            <div className="formula">P(Bear<sub>t</sub> | x<sub>t</sub>) = LightGBM(x<sub>t</sub>)</div>
            <p className="small">ทำใน Dataiku (WS4 Q2): LightGBM แบบ gbdt 27 ต้นไม้, 31 leaves, learning rate 0.2 ชนะ 7 โมเดลที่เทียบ x<sub>t</sub> คือ 10 คอลัมน์ของวันเดียวกันจากไฟล์ WS3 ได้แก่ ราคาปิด PTTEP, Brent, SET, S&amp;P 500, USD/THB, THB/USD, พันธบัตร 10 ปีและ 1 ปี และธงเติมข้อมูลพันธบัตร 2 คอลัมน์ ค่า P(Bear) บนหน้านี้มาจาก score recipe ของ Dataiku</p></div>
          <div><span className="step">ขั้นที่ 3 · ตัดสินใจ</span>
            <div className="formula">Signal<sub>t</sub> = Bear ถ้า P(Bear<sub>t</sub>) ≥ x ไม่เช่นนั้นเป็น Bull โดย x = 0.45</div></div>
        </div>
        <p>Dataiku แบ่งข้อมูลแบบสุ่มเป็น train 1,107 วัน และ test 258 วัน ผลบนชุด test ได้ ROC-AUC = <b>0.998</b></p>
        <div className="tbl"><table className="num">
          <thead><tr><th>เกณฑ์ x</th><th>Recall (Bear)</th><th>Precision</th><th>F1</th><th>Accuracy</th></tr></thead>
          <tbody>
            <tr><td>0.40</td><td>0.983</td><td>0.944</td><td>0.964</td><td>0.965</td></tr>
            <tr className="hl"><td>0.45 · ที่เลือก</td><td>0.983</td><td>0.960</td><td>0.971</td><td>0.973</td></tr>
            <tr><td>0.50</td><td>0.983</td><td>0.960</td><td>0.971</td><td>0.973</td></tr>
            <tr><td>0.55</td><td>0.967</td><td>0.975</td><td>0.971</td><td>0.973</td></tr>
          </tbody>
        </table></div>
        <p><b>ทำไมเลือก 0.45:</b> สำหรับคนที่ถือหุ้นอยู่ การพลาดขาลงหมายถึงต้องทนถือขณะราคาลง ซึ่งเคยลงลึกถึง −51% ส่วนการเตือนผิดเสียแค่โอกาสกำไรบางส่วนจากการลดสัดส่วนชั่วคราว ที่เกณฑ์ 0.45 โมเดล Dataiku พลาดขาลง 2 ครั้งและเตือนผิด 5 ครั้งจาก 258 วัน ถ้าลดเหลือ 0.40 จะเตือนผิดเพิ่มเป็น 7 ครั้งโดยจับขาลงได้ไม่เพิ่ม ถ้าเพิ่มเป็น 0.55 จะพลาดขาลงเพิ่มเป็น 4 ครั้ง ลองเลื่อนแถบเกณฑ์ในส่วนสัญญาณเพื่อดูผลได้</p>
      </>
    ),
  },
  {
    id: 'd6', n: 6, t: 'AI Governance & Ethics', sub: 'การบริหารความเสี่ยงของโมเดลและความโปร่งใส',
    body: (
      <div className="gov-grid">
        <div><h4>ความเสี่ยงของโมเดล</h4><ul>
          <li><b>Look-ahead bias:</b> โมเดล Dataiku ใช้ข้อมูลวันที่ t ทายสภาวะของวันที่ t เอง จึงเป็นการจำแนกสภาวะปัจจุบัน ไม่ใช่การทายล่วงหน้า และตลาดสหรัฐปิดหลังตลาดไทย ค่า S&amp;P 500 ของวันเดียวกันจึงยังไม่มีตอนตลาดไทยปิด</li>
          <li><b>Data leakage:</b> label Bull/Bear คำนวณจาก <code>PTTEP_Close</code> เทียบ SMA50 และ Dataiku ใช้ <code>PTTEP_Close</code> เป็น input ด้วย (สำคัญที่สุด 28%) อีกทั้งแบ่ง train/test แบบสุ่ม วันติดกันจึงอยู่ทั้งสองฝั่ง ROC-AUC 0.998 จึงสูงเกินกว่าที่จะได้เมื่อใช้งานจริง</li>
          <li><b>Overfitting:</b> เปิดเผย AUC ชุด train 1.000 เทียบชุด test 0.998 จาก Dataiku ค่าที่เท่ากันเกือบทั้งหมดเกิดจาก leakage ข้างต้น ไม่ได้แปลว่าโมเดลทั่วไปดี</li>
          <li><b>Label ช่วงต้น:</b> 49 แถวแรกยังไม่มี SMA50 และถูกตั้งเป็น Bear อัตโนมัติ แถวเหล่านี้ยังอยู่ในข้อมูลที่ Dataiku ใช้</li>
          <li><b>การเติมข้อมูล:</b> ผลตอบแทนพันธบัตรที่ถูก interpolate มีคอลัมน์ <code>*_Imputed</code> บอกไว้</li>
          <li><b>ความสัมพันธ์เปลี่ยนไป:</b> correlation เปลี่ยนตามเวลา (ดูได้จาก radar) ต้องเทรนใหม่เป็นระยะ และเลิกใช้ถ้า AUC ช่วงทดสอบลดใกล้ 0.5</li>
        </ul></div>
        <div><h4>ความโปร่งใสและจริยธรรม</h4><ul>
          <li>แสดงข้อความ "ไม่ใช่คำแนะนำการลงทุน" บนหน้าจอ</li>
          <li>แสดงแหล่งข้อมูล วิธีอัปเดต และข้อจำกัด</li>
          <li>เปิดเผย feature importance และผลทดสอบจาก Dataiku ไม่ให้เป็น black box</li>
          <li>ผู้ใช้กำหนดเกณฑ์เองและเห็นผลทันที คนเป็นผู้ตัดสินใจขั้นสุดท้าย</li>
          <li>ระบุว่า correlation คือการขยับร่วมกัน ไม่ใช่เหตุและผล</li>
          <li>ไม่เก็บข้อมูลส่วนบุคคล ใช้เฉพาะข้อมูลตลาดสาธารณะ</li>
        </ul></div>
      </div>
    ),
  },
]

export default function AnalysisSection() {
  const [open, setOpen] = useState<Record<string, boolean>>({ d1: true })
  const allOpen = ITEMS.every(i => open[i.id])
  const jump = (id: string) => {
    setOpen(o => ({ ...o, [id]: true }))
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  return (
    <div className="analysis">
      <nav className="analysis-index glass" aria-label="หัวข้อ WS2">
        <p className="eyebrow">โจทย์ WS2 ทั้ง 6 ข้อ</p>
        <ol>
          {ITEMS.map(i => (
            <li key={i.id}><button type="button" className={open[i.id] ? 'on' : ''} onClick={() => jump(i.id)}>
              <span className="idx">{i.n}</span><span>{i.t}</span></button></li>
          ))}
        </ol>
        <button type="button" className="btn-ghost" onClick={() =>
          setOpen(allOpen ? {} : Object.fromEntries(ITEMS.map(i => [i.id, true])))}>
          {allOpen ? 'ปิดทุกข้อ' : 'เปิดทุกข้อ'}</button>
        <p className="asof">ตัวเลขในส่วนนี้มาจากข้อมูล WS3 (4 ม.ค. 2021 – 10 พ.ย. 2026, 1,365 วันทำการ) และผลโมเดลจาก Dataiku (WS4) ถ้าโหลด CSV อื่น dashboard ด้านบนจะเปลี่ยน แต่ข้อความส่วนนี้ไม่เปลี่ยน</p>
      </nav>
      <div className="analysis-body">
        {ITEMS.map(i => (
          <Card key={i.id} id={i.id} className="deliv" open={!!open[i.id]} onToggle={v => setOpen(o => ({ ...o, [i.id]: v }))}
            eyebrow={<>ข้อ {i.n}</>} title={i.t} summary={<span className="deliv-sub">{i.sub}</span>}>
            {i.body}
          </Card>
        ))}
      </div>
    </div>
  )
}

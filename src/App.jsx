import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

function App() {
  const BACKEND = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  const [niche, setNiche] = useState('AI untuk YouTube')
  const [style, setStyle] = useState('storytelling')
  const [duration, setDuration] = useState(120)
  const [keywords, setKeywords] = useState('AI, YouTube, otomasi, konten')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [successMsg, setSuccessMsg] = useState('')

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/jobs`)
      const data = await res.json()
      setJobs(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      // ignore on first load
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const onGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const payload = {
        niche,
        style,
        duration: Number(duration),
        keywords: keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      }
      const res = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Gagal generate (status ${res.status})`)
      }
      const data = await res.json()
      setSuccessMsg('Konten berhasil digenerate!')
      const newJob = { _id: data.id, ...data.job }
      setJobs((prev) => [newJob, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const callTTS = async (jobId) => {
    try {
      const res = await fetch(`${BACKEND}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, lang: 'id', slow: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Gagal membuat voice-over')
      setJobs((prev) => prev.map(j => j._id === jobId ? { ...j, audio_url: data.audio_url, status: data.status } : j))
    } catch (e) {
      alert(e.message)
    }
  }

  const callThumbnail = async (jobId) => {
    try {
      const res = await fetch(`${BACKEND}/api/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Gagal membuat thumbnail')
      setJobs((prev) => prev.map(j => j._id === jobId ? { ...j, thumbnail_url: data.thumbnail_url, status: data.status } : j))
    } catch (e) {
      alert(e.message)
    }
  }

  const callUpload = async (jobId) => {
    try {
      const res = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, privacy_status: 'unlisted' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Gagal upload ke YouTube')
      setJobs((prev) => prev.map(j => j._id === jobId ? { ...j, youtube_url: data.youtube_url, upload_status: data.status } : j))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      {/* Hero Section with Spline */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/4cHQr84zOGAHOehh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.35),rgba(56,189,248,0.18)_40%,rgba(251,146,60,0.12)_70%,rgba(2,6,23,1)_90%)]" />

        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-white/80 backdrop-blur">
              AI Voice Agent • YouTube Automation
            </p>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold leading-tight">
              Bangun Channel YouTube Otomatis dengan Agen AI
            </h1>
            <p className="mt-4 text-white/80 text-base sm:text-lg">
              Ide, judul, outline, dan skrip video dibuat otomatis. Fokus pada strategi, biarkan agen AI mengurus riset & copywriting.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#generator" className="inline-flex items-center justify-center rounded-md bg-indigo-500 hover:bg-indigo-400 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition">
                Mulai Generate Konten
              </a>
              <a href="/test" className="inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 px-5 py-3 text-sm font-semibold transition">
                Cek Koneksi Backend
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Generator */}
      <section id="generator" className="relative z-10 -mt-10 rounded-t-3xl bg-slate-900/80 backdrop-blur-sm border-t border-white/10 px-6 py-10">
        <div className="max-w-6xl mx-auto grid xl:grid-cols-3 md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold">Generator Konten</h2>
            <p className="text-white/70 text-sm mt-1">Masukkan niche, pilih gaya, dan agen akan membuatkan outline + skrip.</p>

            {error && (
              <div className="mt-4 rounded-md bg-rose-500/10 border border-rose-400/30 text-rose-200 text-sm p-3">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-sm p-3">
                {successMsg}
              </div>
            )}

            <form onSubmit={onGenerate} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm mb-1">Niche / Topik</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="Contoh: Produktivitas, Teknologi AI, Bisnis Online" />
              </div>
              <div>
                <label className="block text-sm mb-1">Gaya Narasi</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400">
                  <option value="educational">Educational</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="listicle">Listicle</option>
                  <option value="news">News</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Durasi Target (detik)</label>
                <input type="number" min={30} max={900} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm mb-1">Kata Kunci (pisahkan dengan koma)</label>
                <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="ai, youtube automation, tutorial" />
              </div>
              <button disabled={loading} className="w-full rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 px-4 py-2 font-semibold transition">
                {loading ? 'Menghasilkan...' : 'Generate Script'}
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Hasil Terbaru</h2>
            <div className="space-y-4">
              {jobs.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70 text-sm">
                  Belum ada job. Coba generate dulu.
                </div>
              )}
              {jobs.map((job, idx) => (
                <article key={(job._id || job.id || idx) + '-' + idx} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/60">Niche</p>
                      <h3 className="text-lg font-semibold">{job.niche}</h3>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">{job.style}</span>
                  </div>
                  <h4 className="mt-2 text-white/90 font-medium">{job.title}</h4>
                  {Array.isArray(job.outline) && job.outline.length > 0 && (
                    <ul className="mt-3 list-disc list-inside text-sm text-white/70 space-y-1">
                      {job.outline.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  )}
                  {job.script && (
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-white/80 bg-black/30 border border-white/10 rounded p-3 max-h-56 overflow-auto">{job.script}</pre>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => callTTS(job._id)} className="text-sm px-3 py-2 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30">Buat Voice-over</button>
                    <button onClick={() => callThumbnail(job._id)} className="text-sm px-3 py-2 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30">Buat Thumbnail</button>
                    <button onClick={() => callUpload(job._id)} className="text-sm px-3 py-2 rounded-md bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/30">Upload ke YouTube</button>
                    <button onClick={fetchJobs} className="text-sm px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/10">Refresh</button>
                  </div>

                  {/* Previews */}
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    {job.audio_url && (
                      <div className="bg-black/30 rounded-md border border-white/10 p-3">
                        <p className="text-xs text-white/60 mb-2">Voice-over</p>
                        <audio controls src={`${BACKEND}${job.audio_url}`} className="w-full" />
                      </div>
                    )}
                    {job.thumbnail_url && (
                      <div className="bg-black/30 rounded-md border border-white/10 p-3">
                        <p className="text-xs text-white/60 mb-2">Thumbnail</p>
                        <img src={`${BACKEND}${job.thumbnail_url}`} alt="thumbnail" className="w-full rounded" />
                      </div>
                    )}
                  </div>

                  {job.youtube_url && (
                    <div className="mt-3 text-sm">
                      <a className="text-sky-300 hover:text-sky-200 underline" href={job.youtube_url} target="_blank" rel="noreferrer">Lihat di YouTube</a>
                    </div>
                  )}

                  {(job.upload_status || job.status) && (
                    <p className="mt-2 text-xs text-white/60">Status: {job.upload_status || job.status}</p>
                  )}
                </article>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={fetchJobs} className="text-sm px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/10">Muat Ulang</button>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-white/50">
          Backend: <span className="font-mono">{BACKEND}</span>
        </footer>
      </section>
    </div>
  )
}

export default App

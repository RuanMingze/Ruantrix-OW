// 注：由于现在只有产品页面可能会出现带有参数的请求，所以我们只在此页面预防水合错误
'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Download, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import supabase from '@/lib/supabase'
import { pinyin } from 'pinyin-pro'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const productMap: Record<number, string> = {
  1: 'paperstation',
  2: 'screensaver',
  3: 'toolbox',
  4: 'ai',
  5: 'search',
}

function ProductCard({ product, idx, onClick, betaApplication }: { product: any; idx: number; onClick: () => void; betaApplication: any | null }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const hasBetaQualification = betaApplication && betaApplication.product === productMap[product.id]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setMousePosition({ x, y })
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener('mousemove', handleMouseMove)
      card.addEventListener('mouseenter', () => setIsHovered(true))
      card.addEventListener('mouseleave', () => setIsHovered(false))
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove)
        card.removeEventListener('mouseenter', () => setIsHovered(true))
        card.removeEventListener('mouseleave', () => setIsHovered(false))
      }
    }
  }, [])

  return (
    <div
      ref={cardRef}
      key={product.id}
      data-aos="fade-up"
      data-aos-delay={100 + idx * 200}
      className="relative flex flex-col border border-border bg-card rounded-2xl p-8 transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {isHovered && (
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(224, 112, 32, 0.15), transparent 60%)`,
            opacity: 1,
            borderRadius: '1rem'
          }}
        />
      )}
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <img 
            src={product.icon} 
            alt={product.title}
            className="w-20 h-20 object-cover rounded-2xl"
          />
        </div>
        <h3 className="text-2xl font-bold text-primary mb-3">
          {product.title}
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground mb-6 flex-1">
          {product.description}
        </p>
        <div className="flex gap-4">
          <a
            href={hasBetaQualification ? `${product.detailUrl}?isbeta=true` : product.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300"
          >
            <ExternalLink size={16} />
            查看详情
          </a>
          {product.downloadUrl && (
            <a
              href={product.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-primary hover:bg-card/50 transition-all duration-300"
            >
              <Download size={16} />
              下载
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductModal({ product, onClose, betaApplication }: { product: any; onClose: () => void; betaApplication: any | null }) {
  const hasBetaQualification = betaApplication && betaApplication.product === productMap[product.id]
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full bg-card border border-border rounded-2xl p-8 pt-20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {product.screenshot && (
          <div className="absolute top-4 right-4 w-64 h-48 rounded-lg overflow-hidden border border-border shadow-lg">
            <img 
              src={product.screenshot} 
              alt={`${product.title} 截图`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="mb-6">
          <img 
            src={product.icon} 
            alt={product.title}
            className="w-24 h-24 object-cover rounded-2xl"
          />
        </div>
        
        <h2 className="text-3xl font-bold text-primary mb-4">
          {product.title}
        </h2>
        
        <p className="text-lg leading-relaxed text-muted-foreground mb-6">
          {product.description}
        </p>
        
        <div className="flex gap-4">
          <a
            href={hasBetaQualification ? `${product.detailUrl}?isbeta=true` : product.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300"
          >
            <ExternalLink size={16} />
            查看详情
          </a>
          {product.downloadUrl && (
            <a
              href={product.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-primary hover:bg-card/50 transition-all duration-300"
            >
              <Download size={16} />
              下载
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-muted-foreground hover:text-primary transition-colors"
          aria-label="关闭"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  )
}
export function ProductsSection() {
  const searchParams = useSearchParams()
  const initialSearchQuery = searchParams.get('search') || ''
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery)
  const [user, setUser] = useState<any>(null)
  const [betaApplication, setBetaApplication] = useState<any>(null)
  const [betaQualified, setBetaQualified] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkSession()
    checkBetaQualification()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  const checkBetaQualification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('has_beta_access')
          .eq('email', session.user.email)
          .single()
        
        if (profile?.has_beta_access) {
          setBetaQualified(true)
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  const products = [
    {
      id: 1,
      title: 'PaperStation 浏览器',
      description: '基于 Electron + Chromium 打造的现代化浏览器，支持知识捕获、智能总结、结构化导出等功能。不只是浏览器，更是你的知识助手。',
      icon: 'https://paperstation-introduction-page.pages.dev/images/logo.png',
      screenshot: 'https://paperstation-introduction-page.pages.dev/images/screenshot.png',
      detailUrl: 'https://paperstation-introduction-page.pages.dev/',
      downloadUrl: null
    },
    {
      id: 2,
      title: 'RuanmScreenSaver 屏保程序',
      description: '集天气查询、计算器、编程工具、系统知识于一体的实用工具箱，提升您的工作效率。支持 Windows、macOS 和 Linux 多平台。',
      icon: 'https://ruanmingze.github.io/Ruanm-Official-Website/screensaver.png',
      screenshot: 'https://ruanmingze.github.io/Ruanm-Official-Website/%E5%B1%8F%E4%BF%9D.png',
      detailUrl: 'https://ruanmingze.github.io/Ruanm-Official-Website/program.html',
      downloadUrl: null
    },
    {
      id: 3,
      title: 'TheGuide 工具箱',
      description: '集天气查询、计算器、编程工具、系统知识于一体的实用工具箱，提升您的工作效率。支持 Windows、macOS 和 Linux 多平台。',
      icon: 'https://t-t-i.pages.dev/favicon.ico',
      screenshot: 'https://luckycola.com.cn/public/imgs/luckycola_Imghub_forever_c4w8eKYK17747658308018006.png',
      detailUrl: 'https://ruanmingze.github.io/t-t-i',
      downloadUrl: null
    },
    {
      id: 4,
      title: '小R AI助手',
      description: '智能AI助手，帮助您快速解决问题、获取信息、提升工作效率。支持多种AI功能，让工作更轻松。',
      icon: 'https://ruanmingze.github.io/Ruanm-Official-Website/RuanmAi.png',
      screenshot: 'https://ruanmingze.github.io/Ruanm-Official-Website/xiaor-GUI.png',
      detailUrl: 'https://ruanmingze.github.io/Ruanm-Official-Website/xiaor.html',
      downloadUrl: null
    },
    {
      id: 5,
      title: 'ChickRubGo搜索引擎',
      description: '本土化搜索引擎，更符合中文用户需求。快速搜索，精准结果，提供更好的搜索体验。',
      icon: 'https://ruanmingze.github.io/Ruanm-Official-Website/ChickRubGo.png',
      screenshot: 'https://ruanmingze.github.io/Ruanm-Official-Website/ChickRubGo-UI.png',
      detailUrl: 'https://ruanmingze.github.io/Ruanm-Official-Website/chickrubgo.html',
      downloadUrl: null
    }
  ]

  const filteredProducts = localSearchQuery
    ? products.filter(p => {
        const searchLower = localSearchQuery.toLowerCase().trim()
        if (!searchLower) return true
        
        const titleLower = p.title.toLowerCase()
        const descLower = p.description.toLowerCase()
        const urlLower = p.detailUrl.toLowerCase()
        
        const titlePinyin = pinyin(p.title, { toneType: 'none', type: 'array' }).join('').toLowerCase()
        const titleInitials = pinyin(p.title, { toneType: 'none', type: 'array', pattern: 'first' }).join('').toLowerCase()
        const descPinyin = pinyin(p.description, { toneType: 'none', type: 'array' }).join('').toLowerCase()
        const descInitials = pinyin(p.description, { toneType: 'none', type: 'array', pattern: 'first' }).join('').toLowerCase()
        
        const titleFullText = `${titleLower} ${titlePinyin} ${titleInitials}`
        const descFullText = `${descLower} ${descPinyin} ${descInitials}`
        
        const searchChars = searchLower.split('')
        
        const matchInTitle = () => {
          let charIndex = 0
          for (const char of titleFullText) {
            if (char === searchChars[charIndex]) {
              charIndex++
              if (charIndex === searchChars.length) {
                return true
              }
            }
          }
          return false
        }
        
        const matchInDesc = () => {
          let charIndex = 0
          for (const char of descFullText) {
            if (char === searchChars[charIndex]) {
              charIndex++
              if (charIndex === searchChars.length) {
                return true
              }
            }
          }
          return false
        }
        
        const matchInUrl = urlLower.includes(searchLower)
        
        return matchInTitle() || matchInDesc() || matchInUrl
      })
    : products

  return (
    <>
      <section id="products" className="py-32 px-6 lg:px-8" suppressHydrationWarning>
        <div className="mx-auto max-w-7xl">
          <div className="mb-20">
            <p
              data-aos="fade-up"
              className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-6"
            >
              产品中心
            </p>
            <h2
              data-aos="fade-up"
              data-aos-delay="100"
              className="text-3xl font-bold tracking-tight text-primary md:text-5xl text-balance"
            >
              精心打造的产品
            </h2>
            
            <div className="mt-8" data-aos="fade-up" data-aos-delay="200">
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="搜索产品..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            {localSearchQuery && (
              <p className="mt-4 text-muted-foreground">
                搜索结果: "{localSearchQuery}" ({filteredProducts.length} 个产品)
              </p>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {filteredProducts.map((product, idx) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  idx={idx}
                  onClick={() => setSelectedProduct(product)}
                  betaApplication={mounted ? betaApplication : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                啊呜~产品被恐龙吃掉了！
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          betaApplication={mounted ? betaApplication : null}
        />
      )}
    </>
  )
}


import { useState } from 'react'
import Hero from '../components/Hero'
import PostList from '../components/PostList'
import CategoryBar from '../components/CategoryBar'
import CategoryNav from '../components/CategoryNav'

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null)

  return (
    <div className="px-8 py-8 md:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-7">
        {/* 左侧：主内容区 */}
        <div className="flex-1 min-w-0">
          <Hero />
          {/* 移动端：横排分类 pill */}
          <div className="lg:hidden">
            <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
          <PostList category={selectedCategory} />
        </div>

        {/* 右侧：分类导航 (仅桌面端) */}
        <aside className="hidden lg:block w-48 shrink-0">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
        </aside>
      </div>
    </div>
  )
}

import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './top-bar'
import { LeftSidebar } from './left-sidebar'
import { RightSidebar } from '../feed/right-sidebar'
import { MessengerPopup } from './messenger-popup'

const FULLSCREEN_ROUTES = ['/messages/']

export function Layout() {
  const location = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((p) => location.pathname.startsWith(p))

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-gray-100">
        <TopBar />
        <div className="pt-14 h-screen">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <TopBar />
      <div className="pt-14 flex justify-center">
        <div className="flex w-full max-w-[1280px]">
          <LeftSidebar />
          <main className="flex-1 min-h-[calc(100vh-56px)] py-4 px-4 max-w-[820px] mx-auto lg:mx-0">
            <Outlet />
          </main>
          <RightSidebar />
        </div>
      </div>

      <MessengerPopup />
    </div>
  )
}

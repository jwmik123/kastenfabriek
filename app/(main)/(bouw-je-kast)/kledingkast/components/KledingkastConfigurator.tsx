'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import { useClosetStore } from '../store'
import StepWizard from './StepWizard'

const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), { ssr: false })

export default function KledingkastConfigurator({ pricingData }: { pricingData: FullPricingData }) {
  const hydrate = useClosetStore((s) => s.hydrate)

  useEffect(() => {
    hydrate(pricingData)
  }, [pricingData, hydrate])

  return (
    <>
    <div className="configurator-container relative w-full flex flex-col lg:flex-row pt-[80px]">
      {/* Canvas — left panel */}
      <div className="w-full h-[60vh] lg:h-full lg:w-2/3">
        <ThreeCanvas />

      </div>
      {/* Wizard — right panel */}
      <div className="w-full lg:w-1/3 lg:h-full bg-white overflow-y-auto">
        <StepWizard />
      </div>
    </div>
      {/* <section className="w-full border-t border-gray-200 py-4 md:py-12" data-observe-view="USP bar">
        <ul className="lg:grid grid-flow-col lg:auto-cols-fr">
          <li className="pt-4 pb-4 md:pt-24 md:pb-12">
            <button className="outline-none custom text-neutral-900 flex flex-col gap-8 px-16">
              <p className="normal-12 text-left">Beoordeling gebaseerd op 9502 beoordelingen verzameld op tylko.com</p>
              <div className="flex flex-row gap-8">
                <p className="semibold-24">4.9/5 </p>
                <div className="flex gap-4 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36" className="w-16 aspect-square"><g clipPath="url(#star_svg__clip0_15846_59452)"><path fill="currentColor" fillRule="evenodd" d="M18 28.458 6.875 36l3.385-13.456L0 13.752l13.216-.774L18 0l4.784 12.977L36 13.751l-10.26 8.793L29.125 36 18 28.458Z" clipRule="evenodd" /></g></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36" className="w-16 aspect-square"><g clipPath="url(#star_svg__clip0_15846_59452)"><path fill="currentColor" fillRule="evenodd" d="M18 28.458 6.875 36l3.385-13.456L0 13.752l13.216-.774L18 0l4.784 12.977L36 13.751l-10.26 8.793L29.125 36 18 28.458Z" clipRule="evenodd" /></g></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36" className="w-16 aspect-square"><g clipPath="url(#star_svg__clip0_15846_59452)"><path fill="currentColor" fillRule="evenodd" d="M18 28.458 6.875 36l3.385-13.456L0 13.752l13.216-.774L18 0l4.784 12.977L36 13.751l-10.26 8.793L29.125 36 18 28.458Z" clipRule="evenodd" /></g></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36" className="w-16 aspect-square"><g clipPath="url(#star_svg__clip0_15846_59452)"><path fill="currentColor" fillRule="evenodd" d="M18 28.458 6.875 36l3.385-13.456L0 13.752l13.216-.774L18 0l4.784 12.977L36 13.751l-10.26 8.793L29.125 36 18 28.458Z" clipRule="evenodd" /></g></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36" className="w-16 aspect-square"><g clipPath="url(#star_svg__clip0_15846_59452)"><path fill="currentColor" fillRule="evenodd" d="M18 28.458 6.875 36l3.385-13.456L0 13.752l13.216-.774L18 0l4.784 12.977L36 13.751l-10.26 8.793L29.125 36 18 28.458Z" clipRule="evenodd" /></g></svg>
                </div>
              </div>
            </button>
            <hr className="block my-16 border-t md:hidden border-t-grey-700" />
          </li>
          <li className="pt-4 pb-4 md:pt-24 md:pb-12 md:px-16 flex gap-16 md-max:items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" className="van_svg__w-24 van_svg__h-24 van_svg__text-white van_svg__lg:w-32 van_svg__lg:h-32 w-full h-full max-h-24 max-w-24" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M9.438 3.96a4.872 4.872 0 0 0-6.866.632 4.877 4.877 0 0 0-.322 5.801v10.42h3a2.25 2.25 0 0 0 4.5 0h6.253a2.25 2.25 0 0 0 4.5.001H22.5V15.84l-.057-.137-1.492-3.607a2.25 2.25 0 0 0-2.08-1.39H16.5V7.579h-5.306A4.88 4.88 0 0 0 9.438 3.96ZM11 9.08a4.876 4.876 0 0 1-7.25 2.773v4.727H15v-7.5h-4ZM8.478 5.114a3.375 3.375 0 1 1-4.316 5.19 3.375 3.375 0 0 1 4.316-5.19ZM7.5 18.563c-.667 0-1.266.29-1.678.75H3.75v-1.234H16.5v-1.016H21v2.251h-1.068a2.245 2.245 0 0 0-1.678-.751c-.666 0-1.265.29-1.677.75h-7.4a2.244 2.244 0 0 0-1.676-.75Zm12.065-5.894 1.197 2.894H16.5v-3.357h2.372a.75.75 0 0 1 .693.463Zm-2.062 8.144a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM7.5 20.063a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM8.623 6.765l-.48.577-1.388 1.67-.48.576-.05-.042-.577-.48-.865-.719-.576-.48.959-1.152.577.48.338.28.91-1.092.48-.577 1.152.96Z" clipRule="evenodd" /></svg>
            <div className="flex flex-col">
              <h5 className="semibold-16 text-neutral-900 md:mb-8">Inclusief bezorging</h5>
              <p className="normal-12 text-neutral-750">Overal in Europa</p>
              <a rel="noopener noreferrer" target="_blank" className="ty-link-s py-[14px] semibold-12 text-neutral-900 mt-auto hidden md:block"><span className="link-underline">Meer lezen</span></a>
            </div>
            <aside className="md:hidden ml-auto p-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" fill="none" viewBox="0 0 33 32" className="w-24 h-24 text-neutral-900 shrink-0"><path stroke="currentColor" strokeWidth="2" d="M12.442 7.996 20.446 16l-8.004 8" /></svg>
            </aside>
          </li>
          <li className="pt-4 pb-4 md:pt-24 md:pb-12 md:px-16 flex gap-16 md-max:items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" fill="none" viewBox="0 0 24 25" className="w-full h-full max-h-24 max-w-24"><path fill="#1D1E1F" fillRule="evenodd" d="M3 2.813h18v11.463a5.252 5.252 0 0 1 .404 7.148 5.25 5.25 0 0 1-7.954.139H3V2.813Zm9.51 17.25a5.253 5.253 0 0 1 6.99-6.795V8.812h-15v11.25h8.01Zm6.99-15.75v3h-15v-3h15Zm-12.75 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm.75 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm2.25-2.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm.75-3.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm5.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-2.25-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm3.75 5.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9.265-1.88a3.75 3.75 0 1 1-4.796 5.767 3.75 3.75 0 0 1 4.796-5.766Zm-.142 2.116-.48.577-1.388 1.67-.48.576-.05-.042-.577-.48-.865-.719-.576-.48.959-1.152.576.48.34.28.908-1.092.48-.577 1.153.96Z" clipRule="evenodd" /></svg>
            <div className="flex flex-col">
              <h5 className="semibold-16 text-neutral-900 md:mb-8">Gratis 100 dagen retour</h5>
              <p className="normal-12 text-neutral-750">Tijd om verliefd te worden</p>
              <a rel="noopener noreferrer" target="_blank" className="ty-link-s py-[14px] semibold-12 text-neutral-900 mt-auto hidden md:block"><span className="link-underline">Meer lezen</span></a>
            </div>
            <aside className="md:hidden ml-auto p-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" fill="none" viewBox="0 0 33 32" className="w-24 h-24 text-neutral-900 shrink-0"><path stroke="currentColor" strokeWidth="2" d="M12.442 7.996 20.446 16l-8.004 8" /></svg>
            </aside>
          </li>
          <li className="pt-4 pb-4 md:pt-24 md:pb-12 md:px-16 flex gap-16 md-max:items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 32 32" className="w-full h-full max-h-24 max-w-24"><path fill="currentColor" fillRule="evenodd" d="M27 5h-9v1.156h.5a2.5 2.5 0 0 1 0 5H18V14h4.27v3.5a.5.5 0 0 0 1 0V14H27V5Zm0 11h-1.73v1.5a2.5 2.5 0 0 1-5 0V16H18v6h-2.5a.5.5 0 0 0 0 1H18v4h9V16Zm-11-2V9.156h2.5a.5.5 0 0 0 0-1H16V5H5v9h2v-1.257a2.5 2.5 0 0 1 5 0V14h4ZM5 27V16h4v-3.257a.5.5 0 0 1 1 0V16h6v4h-.5a2.5 2.5 0 0 0 0 5h.5v2H5ZM5 3H3v26h26V3H5Z" clipRule="evenodd" /></svg>
            <div className="flex flex-col">
              <h5 className="semibold-16 text-neutral-900 md:mb-8">Optionele montageservice</h5>
              <p className="normal-12 text-neutral-750">Verkrijgbaar in Nederland</p>
              <a rel="noopener noreferrer" target="_blank" className="ty-link-s py-[14px] semibold-12 text-neutral-900 mt-auto hidden md:block"><span className="link-underline">Meer lezen</span></a>
            </div>
            <aside className="md:hidden ml-auto p-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" fill="none" viewBox="0 0 33 32" className="w-24 h-24 text-neutral-900 shrink-0"><path stroke="currentColor" strokeWidth="2" d="M12.442 7.996 20.446 16l-8.004 8" /></svg>
            </aside>
          </li>
          <li className="pt-4 pb-4 md:pt-24 md:pb-12 md:px-16 flex gap-16 md-max:items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" fill="none" viewBox="0 0 21 20" className="w-full h-full max-h-24 max-w-24"><path fill="currentColor" fillRule="evenodd" d="M13.377 2.415 13.97 3.7l1.38.187 1.239.167-.235 1.232-.267 1.4 1.01.976.904.872-.905.858-1.026.972.254 1.4.224 1.236-1.238.155-1.384.174-.607 1.287-.534 1.13-1.094-.613-1.218-.684-1.23.675-1.093.6-.527-1.142-.592-1.286-1.38-.186-1.239-.167.235-1.232.267-1.4-1.01-.976L3 8.463l.905-.858 1.025-.972-.253-1.4-.224-1.236L5.69 3.84l1.385-.173.607-1.287.533-1.131 1.094.614 1.218.684 1.23-.676 1.094-.6.526 1.143Zm.435 2.527 1.302.176-.252 1.324-.128.67.492.475.965.933-.98.93-.49.463.122.667.242 1.34-1.323.166-.674.084-.29.616-.574 1.216-1.15-.646-.603-.338-.602.33-1.153.633-.555-1.204-.29-.63-.683-.092-1.303-.176.253-1.324.128-.67-.492-.475-.966-.933.98-.93.49-.463-.121-.667-.243-1.34 1.323-.166.674-.084.29-.616.574-1.216 1.15.646.603.338.603-.33 1.152-.634.556 1.205.29.63.683.092Zm3.484 5.872.513 2.833-2.813.353-.337.042-.145.308-1.223 2.591-2.472-1.387-.301-.169-.301.165-2.483 1.363-1.195-2.595-.145-.314-.342-.047-2.8-.378.538-2.82-1.224-.245-.663 3.475-.125.654.659.09 3.116.42 1.332 2.892.282.612.585-.322 2.767-1.518 2.75 1.544.582.326.283-.601 1.362-2.885 3.125-.392.65-.081-.118-.649-.63-3.481-1.227.216Z" clipRule="evenodd" /><path stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" strokeWidth="1.25" d="m12.485 7.304-2.48 2.983M8.37 8.926l1.545 1.286" /></svg>
            <div className="flex flex-col">
              <h5 className="semibold-16 text-neutral-900 md:mb-8">10 jaar garantie</h5>
              <p className="normal-12 text-neutral-750">Duurzaam gebouwd</p>
              <a rel="noopener noreferrer" target="_blank" className="ty-link-s py-[14px] semibold-12 text-neutral-900 mt-auto hidden md:block"><span className="link-underline">Meer lezen</span></a>
            </div>
            <aside className="md:hidden ml-auto p-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" fill="none" viewBox="0 0 33 32" className="w-24 h-24 text-neutral-900 shrink-0"><path stroke="currentColor" strokeWidth="2" d="M12.442 7.996 20.446 16l-8.004 8" /></svg>
            </aside>
          </li>
        </ul>
      </section> */}
    </>
  )
}

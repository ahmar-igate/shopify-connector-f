'use client'

import { useState, useEffect } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'

export default function Notification({ message }: { message: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (message) {
      setShow(true);
    }
  }, [message]);

  return (
    <>
      {/* Global notification live region */}
      {show && (
        <div
          aria-live="assertive"
          className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
        >
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <Transition
              show={show}
              enter="transition-opacity duration-300 ease-out"
              enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
              enterTo="opacity-100 translate-y-0 sm:translate-x-0"
              leave="transition-opacity duration-100 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white ring-1 shadow-lg ring-black/5">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <CheckCircleIcon className="size-6 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-gray-900">Success!</p>
                      <p className="mt-1 text-sm text-gray-500">{message}</p>
                    </div>
                    <div className="ml-4 flex shrink-0">
                      <button
                        type="button"
                        onClick={() => setShow(false)}
                        className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      )}
    </>
  )
}

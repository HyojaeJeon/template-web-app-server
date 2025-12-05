'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext({
  modals: [],
  openModal: () => {},
  closeModal: () => {},
  closeAllModals: () => {}
})

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([])

  const openModal = useCallback((modalComponent, props = {}) => {
    const modalId = Date.now().toString()
    setModals(prev => [...prev, { id: modalId, component: modalComponent, props }])
    return modalId
  }, [])

  const closeModal = useCallback((modalId) => {
    setModals(prev => prev.filter(modal => modal.id !== modalId))
  }, [])

  const closeAllModals = useCallback(() => {
    setModals([])
  }, [])

  const value = {
    modals,
    openModal,
    closeModal,
    closeAllModals
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}
"use client"

import type React from "react"

import { useState } from "react"
import {
  StakeholderModal,
  type StakeholderType,
  type DirectorData,
  type StudentData,
  type ClientData,
} from "./stakeholder-modal"

interface StakeholderLinkProps {
  type: StakeholderType
  id: string
  name: string
  className?: string
  children?: React.ReactNode
}

export function StakeholderLink({ type, id, name, className = "", children }: StakeholderLinkProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [data, setData] = useState<DirectorData | StudentData | ClientData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    if (data) return // Already fetched
    setLoading(true)
    try {
      const res = await fetch(`/api/stakeholders/${type}/${id}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Error fetching stakeholder:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    setModalOpen(true)
    fetchData()
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ${className}`}
      >
        {children || name}
      </button>
      <StakeholderModal open={modalOpen} onOpenChange={setModalOpen} type={type} data={data} loading={loading} />
    </>
  )
}

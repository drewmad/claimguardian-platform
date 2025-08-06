/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Statistics cards component for insurance dashboard"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { Shield, DollarSign, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card-variants'
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations'

interface InsuranceStatsProps {
  totalCoverage: number
  totalPremium: number
  activePolicies: number
}

export function InsuranceStatsCards({ totalCoverage, totalPremium, activePolicies }: InsuranceStatsProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem}>
        <motion.div
          variants={cardHover}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <Card variant="insurance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Shield className="w-6 h-6 text-blue-400" />
                </motion.div>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {totalCoverage > 0 ? `$${(totalCoverage / 1000000).toFixed(2)}M` : '$0'}
                  </p>
                  <p className="text-sm text-gray-400">Total Dwelling Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div variants={staggerItem}>
        <motion.div
          variants={cardHover}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <Card variant="insurance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <DollarSign className="w-6 h-6 text-green-400" />
                </motion.div>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '$0'}
                  </p>
                  <p className="text-sm text-gray-400">Total Annual Premium</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div variants={staggerItem}>
        <motion.div
          variants={cardHover}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <Card variant="insurance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <FileText className="w-6 h-6 text-purple-400" />
                </motion.div>
                <div>
                  <p className="text-3xl font-bold text-white">{activePolicies}</p>
                  <p className="text-sm text-gray-400">Active Policies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
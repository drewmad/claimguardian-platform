/**
 * @fileMetadata
 * @purpose Security questions service for account recovery
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "bcryptjs", "@/lib/logger"]
 * @exports ["securityQuestionsService"]
 * @complexity medium
 * @tags ["auth", "security", "recovery"]
 * @status active
 */

import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import * as bcrypt from 'bcryptjs'

export interface SecurityQuestion {
  id: string
  question: string
}

export interface UserSecurityAnswer {
  id: string
  user_id: string
  question_id: string
  question?: SecurityQuestion
}

interface SecurityAnswerInput {
  questionId: string
  answer: string
}

class SecurityQuestionsService {
  private supabase = createClient()
  /**
   * Get all available security questions
   */
  async getQuestions(): Promise<SecurityQuestion[]> {
    try {
      const { data, error } = await this.supabase
        .from('security_questions')
        .select('*')
        .order('question')

      if (error) {
        logger.error('Failed to fetch security questions', error)
        throw error
      }

      return data || []
    } catch (err) {
      logger.error('Error fetching security questions', err)
      throw err
    }
  }

  /**
   * Get user's security questions (without answers)
   */
  async getUserQuestions(userId: string): Promise<UserSecurityAnswer[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_security_answers')
        .select(`
          id,
          user_id,
          question_id,
          security_questions!inner (
            id,
            question
          )
        `)
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to fetch user security questions', error)
        throw error
      }

      return data?.map((item: Record<string, unknown>) => ({
        id: item.id,
        user_id: item.user_id,
        question_id: item.question_id,
        question: item.security_questions
      })) || []
    } catch (err) {
      logger.error('Error fetching user security questions', err)
      throw err
    }
  }

  /**
   * Save user's security answers
   */
  async saveAnswers(userId: string, answers: SecurityAnswerInput[]): Promise<void> {
    try {
      // Hash all answers
      const hashedAnswers = await Promise.all(
        answers.map(async (answer) => ({
          user_id: userId,
          question_id: answer.questionId,
          answer_hash: await this.hashAnswer(answer.answer)
        }))
      )

      // Delete existing answers
      const { error: deleteError } = await this.supabase
        .from('user_security_answers')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        logger.error('Failed to delete existing security answers', deleteError)
        throw deleteError
      }

      // Insert new answers
      const { error: insertError } = await this.supabase
        .from('user_security_answers')
        .insert(hashedAnswers)

      if (insertError) {
        logger.error('Failed to save security answers', insertError)
        throw insertError
      }

      logger.info('Security answers saved successfully', { userId, count: answers.length })
    } catch (err) {
      logger.error('Error saving security answers', err)
      throw err
    }
  }

  /**
   * Verify security answer
   */
  async verifyAnswer(userId: string, questionId: string, answer: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_security_answers')
        .select('answer_hash')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single()

      if (error || !data) {
        logger.error('Failed to fetch security answer', error)
        return false
      }

      const isValid = await this.compareAnswer(answer, data.answer_hash)
      
      logger.info('Security answer verification', { 
        userId, 
        questionId, 
        isValid 
      })

      return isValid
    } catch (err) {
      logger.error('Error verifying security answer', err)
      return false
    }
  }

  /**
   * Verify multiple security answers
   */
  async verifyAnswers(userId: string, answers: SecurityAnswerInput[]): Promise<boolean> {
    try {
      const results = await Promise.all(
        answers.map(answer => 
          this.verifyAnswer(userId, answer.questionId, answer.answer)
        )
      )

      const allValid = results.every(result => result === true)
      
      logger.info('Multiple security answers verification', { 
        userId, 
        count: answers.length,
        allValid 
      })

      return allValid
    } catch (err) {
      logger.error('Error verifying multiple security answers', err)
      return false
    }
  }

  /**
   * Hash security answer
   */
  private async hashAnswer(answer: string): Promise<string> {
    // Normalize answer: lowercase and trim
    const normalized = answer.toLowerCase().trim()
    return bcrypt.hash(normalized, 10)
  }

  /**
   * Compare answer with hash
   */
  private async compareAnswer(answer: string, hash: string): Promise<boolean> {
    // Normalize answer: lowercase and trim
    const normalized = answer.toLowerCase().trim()
    return bcrypt.compare(normalized, hash)
  }

  /**
   * Check if user has security questions set up
   */
  async hasSecurityQuestions(userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('user_security_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to check security questions', error)
        return false
      }

      return (count || 0) > 0
    } catch (err) {
      logger.error('Error checking security questions', err)
      return false
    }
  }
}

export const securityQuestionsService = new SecurityQuestionsService()
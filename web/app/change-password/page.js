'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { S_CHANGE_PASSWORD_FIRST_LOGIN } from '@/gql/mutations/staff'
import { useTranslation } from '@/shared/i18n'
import { useToast } from '@/shared/providers/ToastProvider'
import { TextInput, Button } from '@/shared/components/ui'
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

/**
 * 첫 로그인 시 비밀번호 변경 페이지
 * - PENDING 상태 직원만 접근 가능
 * - 임시 비밀번호 → 새 비밀번호로 변경
 * - 성공 시 ACTIVE 상태로 변경되며 대시보드로 이동
 */
export default function ChangePasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [changePassword, { loading }] = useMutation(S_CHANGE_PASSWORD_FIRST_LOGIN, {
    onCompleted: (data) => {
      if (data.sChangePasswordFirstLogin.success) {
        showToast({
          type: 'success',
          title: t('common:success'),
          message: data.sChangePasswordFirstLogin.message || t('settings:password.changeSuccess')
        })

        // 대시보드로 리다이렉트
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: t('common:error'),
        message: error.message || t('settings:password.changeFailed')
      })
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({
        type: 'error',
        title: t('common:error'),
        message: t('settings:password.allFieldsRequired')
      })
      return
    }

    if (newPassword.length < 8) {
      showToast({
        type: 'error',
        title: t('common:error'),
        message: t('settings:password.minLength')
      })
      return
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: t('common:error'),
        message: t('settings:password.mismatch')
      })
      return
    }

    try {
      await changePassword({
        variables: {
          currentPassword,
          newPassword
        }
      })
    } catch (error) {
      // onError에서 처리됨
      console.error('Password change error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-green-50 px-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-mint-500 to-green-500 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('settings:password.firstLogin.title')}
          </h1>
          <p className="text-gray-600">
            {t('settings:password.firstLogin.description')}
          </p>
        </div>

        {/* 비밀번호 변경 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 현재 비밀번호 (임시 비밀번호) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings:password.current')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <TextInput
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings:password.currentPlaceholder')}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('settings:password.firstLogin.temporaryHint')}
              </p>
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings:password.new')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <TextInput
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings:password.newPlaceholder')}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('settings:password.requirements')}
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings:password.confirm')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <TextInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings:password.confirmPlaceholder')}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 제출 버튼 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? t('common:processing') : t('settings:password.changeButton')}
            </Button>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('settings:password.firstLogin.helpText')}
          </p>
        </div>
      </div>
    </div>
  )
}

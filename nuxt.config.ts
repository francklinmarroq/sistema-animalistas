// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Módulos de Nuxt
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt'
  ],

  // Configuración de Supabase
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/setup', '/registro-invitacion', '/registro-invitacion/*', '/confirm']
    }
  },

  // CSS global
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ],

  // Configuración de la app
  app: {
    head: {
      title: 'Sistema Animalistas - Control Financiero',
      meta: [
        { name: 'description', content: 'Sistema de control financiero para organización de rescate animal' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Configuración de runtime
  runtimeConfig: {
    public: {
      // Las variables públicas van aquí
    }
  },

  // Configuración de TypeScript
  typescript: {
    strict: true
  }
})

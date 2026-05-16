import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Salvador123', 10)
  
  // Creamos los Ajustes iniciales (para que no de Error 500)
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      organizationName: 'Ecosistema Salvador',
      defaultWelcomeMessage: '¡Bienvenido al sistema!'
    }
  })

  // Creamos el usuario Administrador
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      name: 'Salvador',
      password: hashedPassword,
    },
  })
  console.log('✅ Base de datos preparada y usuario creado.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
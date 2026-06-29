import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Intentamos crear o actualizar los ajustes por defecto
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      organizationName: 'Ecosistema Salvador',
      defaultWelcomeMessage: '¡Bienvenido al sistema!',
      organizationBuzonInfo: '# Reglamento\nBienvenido al buzón ético.', // <-- ESTO ES LO QUE FALTABA
      isBuzonActive: true,
      nameAcademica: 'Secretaría Académica',
      nameAdministrativa: 'Secretaría Administrativa',
      nameDireccion: 'Dirección General',
      nameTecnico: 'Soporte Técnico'
    },
  })
  console.log('✅ Base de datos inicializada con éxito')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
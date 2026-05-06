export default function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primario border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">{texto}</p>
      </div>
    </div>
  )
}

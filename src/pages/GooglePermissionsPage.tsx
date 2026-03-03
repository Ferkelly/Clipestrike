import { useNavigate } from "react-router-dom";
import { Info, ChevronDown } from "lucide-react";

export default function GooglePermissionsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans text-gray-800">
            <div className="w-full max-w-[500px] bg-white rounded-lg shadow-sm border border-gray-200 p-10">
                {/* Google Logo */}
                <div className="flex justify-center mb-8">
                    <svg width="75" height="24" viewBox="0 0 75 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.24 4.8C9.52 4.8 7.28 6.96 7.28 9.88C7.28 12.8 9.52 14.96 12.24 14.96C14.96 14.96 17.2 12.8 17.2 9.88C17.2 6.96 14.96 4.8 12.24 4.8ZM12.24 12.92C10.74 12.92 9.5 11.66 9.5 9.88C9.5 8.1 10.74 6.84 12.24 6.84C13.74 6.84 14.98 8.1 14.98 9.88C14.98 11.66 13.74 12.92 12.24 12.92ZM23.08 4.8C20.36 4.8 18.12 6.96 18.12 9.88C18.12 12.8 20.36 14.96 23.08 14.96C23.8 14.96 24.36 14.82 24.94 14.54L25.4 12.94C24.78 13.16 24.1 13.28 23.4 13.28C22.24 13.28 21.32 12.86 20.76 11.9L28.18 8.82C27.92 7.82 27.28 6.6 25.46 6.6C23.64 6.6 22.84 7.6 22.18 8.52L23.42 6.1C24.08 5.28 25 4.8 26 4.8C27.24 4.8 28.2 5.16 29 5.86L26.68 3.54L25.04 4.14C24.48 4.34 23.8 4.46 23.08 4.46V4.8ZM23.08 6.84C23.94 6.84 24.58 7.16 24.96 7.6L20.32 9.52C20.48 8 21.6 6.84 23.08 6.84ZM4.12 9.48V12.16H10.66C10.5 13.74 9.14 14.86 7.32 14.86C5.24 14.86 3.56 13.14 3.56 11.06C3.56 8.98 5.24 7.26 7.32 7.26C8.28 7.26 9.14 7.6 9.82 8.24L11.72 6.34C10.52 5.22 8.94 4.54 7.32 4.54C3.72 4.54 0.82 7.44 0.82 11.04C0.82 14.64 3.72 17.54 7.32 17.54C11.08 17.54 13.56 14.9 13.56 11.2C13.56 10.58 13.5 10.02 13.38 9.48H4.12ZM35.38 4.8C32.66 4.8 30.42 6.96 30.42 9.88C30.42 12.8 32.66 14.96 35.38 14.96C36.96 14.96 38.28 14.28 39.04 13.12V14.6H41.26V4.94H39.14V6.62C38.38 5.48 37.06 4.8 35.38 4.8ZM35.8 12.92C34.3 12.92 33.06 11.66 33.06 9.88C33.06 8.1 34.3 6.84 35.8 6.84C37.3 6.84 38.54 8.1 38.54 9.88C38.54 11.66 37.3 12.92 35.8 12.92ZM43.86 0.16V14.6H46.1V0.16H43.86ZM53.66 10.28C53.38 10.02 52.92 9.84 52.34 9.84C51.62 9.84 51.14 10.16 51.14 10.54C51.14 10.96 51.52 11.22 52.12 11.44L53.94 12.18C55.22 12.7 56.12 13.78 56.12 15.2C56.12 17.44 54.2 19.34 52.06 19.34C50.28 19.34 49.04 18.52 48.34 17.26L50.28 16L50.84 17C51.1 17.46 51.68 17.84 52.28 17.84C53 17.84 53.64 17.42 53.64 16.74C53.64 16.2 53.18 15.82 52.6 15.58L50.48 14.78C49.2 14.32 48.34 13.3 48.34 11.96C48.34 9.82 50.18 7.96 52.32 7.96C53.94 7.96 54.88 8.52 55.44 9.56L53.66 10.28ZM61.82 8.36L64.44 14.36L66.74 8.36H69.5L65.54 18.28H63.38L59.34 8.36H61.82ZM69.54 8.36H72.16L74.14 15.14L76.12 8.36H78.74L75.38 18.28H72.94L69.54 8.36V8.36Z" fill="#757575" />
                    </svg>
                </div>

                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-medium mb-6 text-center">O ClipStrike quer acessar sua Conta do Google</h1>

                    <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">JD</div>
                        <div className="text-sm font-medium">john.doe@gmail.com</div>
                        <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                    </div>

                    <p className="text-[15px] font-medium mb-4">O ClipStrike poderá:</p>

                    <div className="space-y-4 mb-8">
                        {[
                            { title: "Gerenciar seus vídeos do YouTube", desc: "Permite fazer upload e editar clipes em seu nome." },
                            { title: "Visualizar sua conta do YouTube", desc: "Permite buscar informações e métricas do canal." },
                            { title: "Acessar dados de analytics", desc: "Permite monitorar o desempenho dos clipes gerados." }
                        ].map((perm, i) => (
                            <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0">
                                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <div className="flex-1">
                                    <div className="text-[14px] font-medium flex items-center gap-2">
                                        {perm.title}
                                        <Info className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{perm.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-5 mb-10 text-xs text-gray-600 leading-relaxed">
                        Ao continuar, você permite que o ClipStrike e o Google usem suas informações de acordo com seus respectivos <span className="text-blue-600 hover:underline cursor-pointer">Termos de Serviço</span> e <span className="text-blue-600 hover:underline cursor-pointer">Política de Privacidade</span>.
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate("/auth/google/accounts")}
                            className="text-blue-600 font-medium text-sm hover:bg-blue-50 px-4 py-2 rounded transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => navigate("/app/dashboard")}
                            className="bg-blue-600 text-white font-medium text-sm px-8 py-2.5 rounded shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

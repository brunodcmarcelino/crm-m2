import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <div style={{ padding: 20 }}>
            <h1>Bem-vindo, {user.email}</h1>
            <button onClick={() => signOut()}>Sair</button>

            <p>Seu sistema protegido está funcionando!</p>
        </div>
    );
}

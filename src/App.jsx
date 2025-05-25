import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZCbGt2pX72YyAYaX0fnXbzYRJAnljhmI",
  authDomain: "movies-galaxy-bceb9.firebaseapp.com",
  projectId: "movies-galaxy-bceb9",
  storageBucket: "movies-galaxy-bceb9.firebasestorage.app",
  messagingSenderId: "1006278565751",
  appId: "1:1006278565751:web:fe0124c62a4d0666d80b72",
  measurementId: "G-8Z5R37BMFH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function MovieApp() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    poster: "",
    link: ""
  });

  const isAdmin = user?.email === "sonalsuran@gmail.com";

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const snapshot = await getDocs(collection(db, "movies"));
    const moviesList = snapshot.docs.map(doc => doc.data());
    setMovies(moviesList);
  };

  const handleLogin = () => {
    const email = prompt("Email");
    const password = prompt("Password");
    signInWithEmailAndPassword(auth, email, password).catch(alert);
  };

  const handleRegister = () => {
    const email = prompt("Register Email");
    const password = prompt("Password");
    createUserWithEmailAndPassword(auth, email, password).catch(alert);
  };

  const handleLogout = () => signOut(auth);

  const handleAddMovie = async () => {
    await addDoc(collection(db, "movies"), formData);
    setFormData({ title: "", description: "", genre: "", poster: "", link: "" });
    fetchMovies();
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-4xl font-bold">🎬 Movies Galaxy</h1>
        <div className="space-x-2">
          {!user && <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleLogin}>Login</button>}
          {!user && <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleRegister}>Register</button>}
          {user && <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleLogout}>Logout</button>}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6 grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <input className="p-2 border" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <input className="p-2 border" placeholder="Genre" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} />
          <input className="p-2 border" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <input className="p-2 border" placeholder="Poster URL" value={formData.poster} onChange={e => setFormData({ ...formData, poster: e.target.value })} />
          <input className="p-2 border" placeholder="OneDrive Link" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
          <button onClick={handleAddMovie} className="col-span-full px-4 py-2 bg-purple-600 text-white rounded">Add Movie</button>
        </div>
      )}

      <input
        className="mb-6 w-full max-w-md mx-auto block p-2 border"
        placeholder="Search for a movie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMovies.map((movie, idx) => (
          <div key={idx} className="rounded-2xl shadow-lg overflow-hidden bg-white">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{movie.title}</h2>
              <p className="text-sm text-gray-600 mb-1">{movie.genre}</p>
              <p className="text-sm text-gray-800 mb-4">{movie.description}</p>
              <a
                href={movie.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded">
                  <Play className="w-4 h-4" /> Watch Now
                </button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dark mode toggle, genre filter, and comment support for logged-in users with star ratings and timestamps
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot
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

function timeAgo(dateStr) {
  const now = new Date();
  const posted = new Date(dateStr);
  const seconds = Math.floor((now - posted) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default function MovieApp() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [genreFilter, setGenreFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false);
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
    const moviesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMovies(moviesList);

    moviesList.forEach(movie => {
      const commentRef = collection(db, "movies", movie.id, "comments");
      onSnapshot(commentRef, snapshot => {
        setComments(prev => ({
          ...prev,
          [movie.id]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        }));
      });
    });
  };

  const handleAddComment = async (movieId) => {
    if (!user || !newComment.trim() || newRating === 0) return;
    const commentData = {
      text: newComment,
      email: user.email,
      createdAt: new Date().toISOString(),
      rating: newRating
    };
    await addDoc(collection(db, "movies", movieId, "comments"), commentData);
    setNewComment("");
    setNewRating(0);
  };

  const handleDeleteComment = async (movieId, commentId) => {
    if (!isAdmin) return;
    await deleteDoc(doc(db, "movies", movieId, "comments", commentId));
  };

  const genres = [...new Set(movies.map(m => m.genre))];

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(search.toLowerCase()) &&
    (genreFilter === "" || movie.genre === genreFilter)
  );

  return (
    <div className={`${
        'bg-black text-white'
      } min-h-screen w-full font-sans flex flex-col items-center justify-start px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24`}>
      <header className="flex flex-col items-center justify-center text-center mb-8 px-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-600 drop-shadow-lg mb-4 md:mb-0 text-center">
          🎬 Movies Galaxy
        </h1>
        <div className="space-x-2 mt-4">
          <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded shadow">
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          {!user && <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow" onClick={() => signInWithEmailAndPassword(auth, prompt('Email'), prompt('Password')).catch(alert)}>Login</button>}
          {!user && <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow" onClick={() => createUserWithEmailAndPassword(auth, prompt('Register Email'), prompt('Password')).catch(alert)}>Register</button>}
          {user && <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow" onClick={() => signOut(auth)}>Logout</button>}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        <input className="p-3 flex-1 min-w-[200px] border border-gray-300 rounded-lg shadow-sm" placeholder="🔍 Search for a movie..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="p-3 border border-gray-300 rounded-lg shadow-sm" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All Genres</option>
          {genres.map((genre, i) => <option key={i} value={genre}>{genre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full max-w-full px-2">
        {filteredMovies.map((movie, idx) => (
          <div key={movie.id || idx} className="bg-white dark:bg-gray-800 rounded-md shadow hover:scale-105 transition duration-300 overflow-hidden border dark:border-gray-700 w-full">
            <div className="p-2 text-center">
              <h2 className="text-sm font-bold truncate">{movie.title}</h2>
              <p className="text-xs text-black mb-1 bg-white inline-block px-2 py-0.5 rounded">{movie.genre}</p>
              <p className="text-sm mb-4 line-clamp-3">{movie.description}</p>
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black mb-4">
                <video src={movie.link} controls controlsList="nodownload" className="w-full h-full rounded-lg border" poster={movie.poster} preload="metadata" style={{ backgroundColor: '#000' }}></video>
              </div>
              {user && (
                <div className="space-y-2">
                  <textarea className="w-full p-2 border rounded text-black" placeholder="Leave a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)}></textarea>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star} className={`cursor-pointer text-xl ${newRating >= star ? 'text-yellow-400' : 'text-gray-400'}`} onClick={() => setNewRating(star)}>★</span>
                    ))}
                  </div>
                  <button onClick={() => handleAddComment(movie.id)} className="px-4 py-1 bg-blue-500 text-white rounded">💬 Post Comment</button>
                </div>
              )}
              <div className="mt-4">
                <h3 className="font-bold text-sm mb-2">Comments:</h3>
                {(comments[movie.id] || []).map((c, i) => (
                  <div key={c.id || i} className="text-sm border-t py-2 flex justify-between items-start">
                    <div>
                      <strong>{c.email}</strong> • <span className="text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                      <div>{c.text}</div>
                      <div className="text-yellow-400 text-sm">{'★'.repeat(c.rating || 0)}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteComment(movie.id, c.id)} className="text-red-500 text-xs">🗑 Delete</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

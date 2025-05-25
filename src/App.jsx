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

      {isAdmin && (
        <div className="mb-10 bg-white text-black p-4 rounded-xl shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-center">📤 Upload a Movie</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <input className="p-2 border rounded w-full" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <input className="p-2 border rounded w-full" placeholder="Genre" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} />
            <input className="p-2 border rounded w-full" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            <input className="p-2 border rounded w-full" placeholder="Poster URL" value={formData.poster} onChange={e => setFormData({ ...formData, poster: e.target.value })} />
            <input className="p-2 border rounded w-full" placeholder="OneDrive MP4 Link" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
          </div>
          <button onClick={async () => {
            await addDoc(collection(db, "movies"), formData);
            setFormData({ title: "", description: "", genre: "", poster: "", link: "" });
            fetchMovies();
          }} className="mt-4 px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded shadow">
            ➕ Add Movie
          </button>
        </div>
      )}
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

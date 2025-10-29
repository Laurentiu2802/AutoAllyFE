import React, { useEffect, useState, useRef } from "react";
import "./dashboard.css";

export default function Dashboard({ keycloak }) {
  const [registered, setRegistered] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (keycloak.authenticated && !hasRegistered.current) {
      hasRegistered.current = true;
      
      fetch('http://localhost:8081/api/users/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        console.log('User registered:', data);
        setRegistered(true);
        loadPosts();
      })
      .catch(error => console.error('Error:', error));
    }
  }, [keycloak.authenticated, keycloak.token]);

  const loadPosts = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/posts', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setMessage('Creating post...');
    
    try {
      const response = await fetch('http://localhost:8081/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postTitle,
          content: postContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Post created:', data);
        setMessage('Post created successfully!');
        setPostTitle('');
        setPostContent('');
        loadPosts(); 
      } else {
        setMessage('Failed to create post');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error connecting to server');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8081/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok || response.status === 204) {
        setMessage('Post deleted successfully!');
        loadPosts(); 
      } else if (response.status === 403) {
        setMessage('You can only delete your own posts');
      } else {
        setMessage('Failed to delete post');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error connecting to server');
    }
  };

  const handleLogout = () => {
    keycloak.logout();
  };

  const getCurrentUserId = () => {
    if (keycloak.tokenParsed) {
      return keycloak.tokenParsed.sub;
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="dashboard-title">You logged in!</h1>
        <button onClick={handleLogout} className="btn-danger">
          Logout
        </button>
      </div>
      
      {registered && <p className="success-message">User registered in database</p>}
      
      <hr className="divider" />
      
      <h2 className="section-title">Create a Post</h2>
      <form onSubmit={handleCreatePost} className="post-form">
        <input 
          type="text" 
          placeholder="Post Title" 
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          required
          className="form-input"
        />
        <textarea 
          placeholder="What's on your mind about cars?" 
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          required
          rows="5"
          className="form-textarea"
        />
        <button type="submit" className="btn-primary">
          Create Post
        </button>
      </form>
      
      {message && <p className="status-message">{message}</p>}
      
      <hr className="divider" />
      
      <h2 className="section-title">All Posts</h2>
      <div className="posts-list">
        {posts.length === 0 ? (
          <p>No posts yet. Create the first one!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
              <p className="post-date">
                {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
              </p>
              {post.userId === getCurrentUserId() && (
                <button 
                  onClick={() => handleDeletePost(post.id)}
                  className="btn-delete"
                >
                  Delete Post
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
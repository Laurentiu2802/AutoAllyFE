import React, { useEffect, useState, useRef } from "react";
import "./dashboard.css";
import { isMechanic, isCarEnthusiast } from "../utils/auth.js";


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

  const handleDeleteAccount = async () => {
  if (!window.confirm(
    'Are you sure you want to delete your account?\n\n' +
    'This will:\n' +
    '- Delete your account permanently\n' +
    '- Delete all your posts\n' +
    '- Log you out immediately\n\n' +
    'This action CANNOT be undone!'
  )) {
    return;
  }

  try {
    const response = await fetch('http://localhost:8081/api/users/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`,
      },
    });

    if (response.ok || response.status === 204) {
      alert('Account deleted successfully. You will be logged out now.');
      keycloak.logout();
    } else if (response.status === 404) {
      alert('Account not found.');
    } else {
      alert('Failed to delete account. Please try again later.');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Error connecting to server. Please try again later.');
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
         {isCarEnthusiast(keycloak) && (
      <button onClick={() => window.location.href = '/appointments'}>
        📅 My Appointments
      </button>
    )}

    {isMechanic(keycloak) && (
      <button onClick={() => window.location.href = '/mechanic/appointments'}>
        📅 Manage Appointments
      </button>
    )}
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

      <hr className="divider" />
      
      <div className="danger-zone" style={{ 
        marginTop: '50px', 
        padding: '20px', 
        border: '2px solid #dc3545', 
        borderRadius: '8px',
        backgroundColor: '#fff5f5'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>⚠️ Danger Zone</h3>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          onClick={handleDeleteAccount}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}